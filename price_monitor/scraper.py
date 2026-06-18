"""Playwright 기반 가격 스크래퍼 (11번가/G마켓 지원, 쿠팡/옥션 수동확인)"""
import os
import re
from pathlib import Path
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
# - auction.co.kr / auction.kr: Cloudflare 봇 차단 ("봇 확인 절차" 확인)
# G마켓은 별도 처리: save_cookies_gmarket.py로 초기화한 프로필로 스크래핑
MANUAL_CHECK_DOMAINS = frozenset([
    "coupang.com",
    "auction.co.kr",
    "auction.kr",
])

# save_cookies_gmarket.py가 생성하는 Chromium 브라우저 프로필 디렉토리
# 쿠키 이식 대신 동일 프로필 재사용 → TLS 핑거프린트 일치로 Cloudflare 우회
GMARKET_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"


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
    """Akamai/Cloudflare WAF로 완전 차단된 도메인인지 확인"""
    host = urlparse(url).netloc.lower()
    return any(d in host for d in MANUAL_CHECK_DOMAINS)


def _is_gmarket(url: str) -> bool:
    """G마켓 도메인 여부 확인 (단축 URL link.gmarket.co.kr 포함)"""
    return "gmarket.co.kr" in urlparse(url).netloc.lower()


def _manual_check_result() -> dict:
    return {"success": True, "manual_check": True, "name": None, "price": None, "out_of_stock": False}


async def scrape_product(url: str) -> dict:
    """
    상품 URL에서 가격, 품절 여부, 상품명 추출.
    실패 시 {"success": False, "error": 에러내용} 반환.
    """
    # 쿠팡/옥션: 스크래핑 시도 없이 즉시 수동확인 반환
    if _is_manual_check(url):
        return _manual_check_result()

    # G마켓: 브라우저 프로필 없으면 수동확인 (save_cookies_gmarket.py 먼저 실행 필요)
    if _is_gmarket(url) and not GMARKET_PROFILE_DIR.exists():
        print("    [G마켓] 브라우저 프로필 없음 → venv/bin/python save_cookies_gmarket.py 먼저 실행")
        return _manual_check_result()

    async with async_playwright() as p:
        # G마켓: 동일 Chromium 프로필 재사용 (TLS 핑거프린트 유지)
        # 일반: 새 브라우저 인스턴스
        if _is_gmarket(url):
            browser = None
            context = await p.chromium.launch_persistent_context(
                str(GMARKET_PROFILE_DIR),
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
                user_agent=USER_AGENT,
            )
        else:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=USER_AGENT)

        page = await context.new_page()

        try:
            await page.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
            # 동적 콘텐츠 렌더링 + 단축 URL 리다이렉트 대기
            await page.wait_for_timeout(2000)

            # 리다이렉트 후 최종 URL로 사이트 재판별 (link.gmarket.co.kr → item.gmarket.co.kr)
            final_url = page.url
            is_gmarket = _is_gmarket(url) or _is_gmarket(final_url)

            # G마켓 프로필 만료 감지: Cloudflare 챌린지 페이지 → 수동확인 폴백
            if is_gmarket:
                title = await page.title()
                if "Just a moment" in title:
                    print("    [G마켓] 프로필 만료 — Cloudflare 재차단. save_cookies_gmarket.py 재실행 필요")
                    return _manual_check_result()

            # ── 상품명 추출 ──────────────────────────────────────────────
            # query_selector 사용: 요소 없을 때 즉시 None 반환 (get_attribute는 30초 대기)
            name: Optional[str] = None
            og_title_el = await page.query_selector('meta[property="og:title"]')
            if og_title_el:
                og_title = await og_title_el.get_attribute("content")
                if og_title:
                    name = og_title.strip()
                    # G마켓 og:title은 "G마켓-상품명" 또는 "G마켓 -상품명" 형식
                    if is_gmarket:
                        for prefix in ("G마켓-", "G마켓 -"):
                            if name.startswith(prefix):
                                name = name[len(prefix):].strip()
                                break

            # ── 가격 추출 단계 1: og:description content에서 숫자 추출 ──
            # G마켓 og:description은 "480,860원" 형식으로 가격만 포함됨
            price: Optional[int] = None
            og_desc_el = await page.query_selector('meta[property="og:description"]')
            if og_desc_el:
                og_desc = await og_desc_el.get_attribute("content")
                if og_desc:
                    price = _extract_price(og_desc)

            # ── 가격 추출 단계 2: CSS 셀렉터 순서대로 시도 ───────────────
            if price is None:
                selectors = [
                    "strong.price_real",   # G마켓 판매가
                    ".price_area strong",  # 11번가
                    ".price_value",
                    ".sell_price",
                ]
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
            # G마켓은 <em> 태그, 11번가는 <button>/<a> 태그 사용
            buy_button_found = False
            buy_button_signal = "없음"
            buy_selectors = [
                'button:has-text("구매하기")',
                'a:has-text("구매하기")',
                'em:has-text("구매하기")',   # G마켓 전용
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

            # Step 2: 품절 버튼 텍스트 감지 (버튼/em 한정 - 추천섹션 오탐 방지)
            sold_out_found = False
            sold_out_signal = "없음"
            soldout_selectors = [
                'button:has-text("품절")',
                'em:has-text("품절")',       # G마켓 전용
                ".btn_soldout",
                "[class*='soldOut']",       # G마켓 soldOut 클래스
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
            # 일반 브라우저: browser.close()가 context도 함께 닫음
            # persistent context: context.close()가 브라우저 프로세스도 종료
            if browser is not None:
                await browser.close()
            else:
                await context.close()
