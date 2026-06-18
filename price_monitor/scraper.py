"""Playwright 기반 가격 스크래퍼 (11번가 지원, 쿠팡/G마켓/옥션 수동확인)"""
import re
from typing import Optional
from urllib.parse import urlparse
from playwright.async_api import async_playwright

# Mac Chrome 최신 버전 User-Agent
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# 페이지 로딩 타임아웃 (30초)
TIMEOUT_MS = 30_000

# 유효 가격 범위 (100원 ~ 1억원)
PRICE_MIN = 100
PRICE_MAX = 100_000_000

# Cloudflare/Akamai WAF로 헤드리스 접근이 완전 차단된 도메인 (수동확인 처리)
# - coupang.com: Akamai WAF (www/m 서브도메인, UA 변경 모두 차단 확인)
# - gmarket.co.kr: Cloudflare JS Challenge (HTTP 403, "Just a moment..." 확인)
# - auction.co.kr / auction.kr: Cloudflare 봇 차단 ("봇 확인 절차" 확인)
MANUAL_CHECK_DOMAINS = frozenset([
    "coupang.com",
    "gmarket.co.kr",
    "auction.co.kr",
    "auction.kr",
])


def _extract_price(text: str) -> Optional[int]:
    """텍스트에서 '원' 앞 숫자 패턴을 추출. 유효 범위 내 첫 번째 값 반환."""
    matches = re.findall(r"([\d,]+)\s*원", text)
    for m in matches:
        try:
            price = int(m.replace(",", ""))
            if PRICE_MIN <= price <= PRICE_MAX:
                return price
        except ValueError:
            continue
    return None


def _is_manual_check(url: str) -> bool:
    """WAF로 차단된 도메인인지 확인"""
    host = urlparse(url).netloc.lower()
    return any(d in host for d in MANUAL_CHECK_DOMAINS)


async def scrape_product(url: str) -> dict:
    """
    상품 URL에서 가격, 품절 여부, 상품명 추출.
    실패 시 {"success": False, "error": 에러내용} 반환.
    """
    # 차단된 도메인은 스크래핑 시도 없이 수동확인 처리
    if _is_manual_check(url):
        return {
            "success": True,
            "manual_check": True,
            "name": None,
            "price": None,
            "out_of_stock": False,
        }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=USER_AGENT)
        page = await context.new_page()

        try:
            await page.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
            # 동적 콘텐츠가 렌더링될 시간 확보
            await page.wait_for_timeout(2000)

            # ── 상품명 추출 ──────────────────────────────────────────────
            # query_selector 사용: 요소 없을 때 즉시 None 반환 (get_attribute는 30초 대기)
            name: Optional[str] = None
            og_title_el = await page.query_selector('meta[property="og:title"]')
            if og_title_el:
                og_title = await og_title_el.get_attribute("content")
                if og_title:
                    name = og_title.strip()

            # ── 가격 추출 단계 1: og:description content에서 숫자 추출 ──
            price: Optional[int] = None
            og_desc_el = await page.query_selector('meta[property="og:description"]')
            if og_desc_el:
                og_desc = await og_desc_el.get_attribute("content")
                if og_desc:
                    price = _extract_price(og_desc)

            # ── 가격 추출 단계 2: CSS 셀렉터 순서대로 시도 ───────────────
            if price is None:
                selectors = [".price_area strong", ".price_value", ".sell_price"]
                for selector in selectors:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            text = await element.inner_text()
                            price = _extract_price(text)
                            if price is not None:
                                break
                    except Exception:
                        continue

            # ── 가격 추출 단계 3: 페이지 전체 텍스트에서 패턴 추출 ────────
            if price is None:
                try:
                    body_text = await page.inner_text("body")
                    price = _extract_price(body_text)
                except Exception:
                    pass

            # ── 품절 여부 확인 ───────────────────────────────────────────
            # 판단 순서:
            #   1) 구매하기 버튼이 활성 상태로 존재하면 → in_stock (최우선)
            #   2) 품절 버튼 텍스트가 있으면 → out_of_stock
            #   3) 둘 다 없으면 → in_stock (기본값, 오탐 방지)

            # Step 1: 구매하기 버튼 존재 + 활성화 여부 감지
            buy_button_found = False
            buy_button_signal = "없음"
            buy_selectors = [
                'button:has-text("구매하기")',
                'a:has-text("구매하기")',
                ".btn_buy",
                "#buyBtn",
                "#btn_buy",
            ]
            for selector in buy_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element and await element.is_visible():
                        disabled = await element.get_attribute("disabled")
                        aria_disabled = await element.get_attribute("aria-disabled")
                        if disabled is None and aria_disabled != "true":
                            buy_button_found = True
                            buy_button_signal = selector
                            break
                except Exception:
                    continue

            # Step 2: 품절 버튼 텍스트 감지 (버튼 한정 - 추천섹션 오탐 방지)
            sold_out_found = False
            sold_out_signal = "없음"
            soldout_selectors = [
                'button:has-text("품절")',
                ".btn_soldout",
            ]
            for selector in soldout_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element and await element.is_visible():
                        sold_out_found = True
                        sold_out_signal = selector
                        break
                except Exception:
                    continue

            # Step 3: 최종 판단
            if buy_button_found:
                out_of_stock = False    # 구매하기 버튼 활성 → 판매중
            elif sold_out_found:
                out_of_stock = True     # 품절 버튼 존재 → 품절
            else:
                out_of_stock = False    # 둘 다 없으면 → 판매중 (기본값)

            # 감지 결과 로그
            status_label = "품절" if out_of_stock else "판매중"
            print(
                f"    [재고감지] 구매버튼={buy_button_signal} | "
                f"품절버튼={sold_out_signal} → {status_label}"
            )

            return {
                "success": True,
                "name": name,
                "price": price,
                "out_of_stock": out_of_stock,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

        finally:
            await browser.close()
