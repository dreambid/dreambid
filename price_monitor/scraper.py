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

# Cloudflare/Akamai WAF로 헤드리스 접근이 완전 차단된 도메인
MANUAL_CHECK_DOMAINS = frozenset([
    "coupang.com",
    "auction.co.kr",
    "auction.kr",
])

# save_cookies_gmarket.py가 생성하는 Chromium 브라우저 프로필 디렉토리
GMARKET_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"

# 명시적 판매중단 문구 목록 (페이지 본문에서 탐색)
DISCONTINUED_PHRASES = [
    "현재 판매중인 상품이 아닙니다",
    "판매가 중지된 상품",
    "판매중지된 상품",
    "판매 중지된 상품",
]


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
    return {"success": True, "manual_check": True, "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False}


async def scrape_product(url: str) -> dict:
    """
    상품 URL에서 가격, 품절 여부, 상품명 추출.

    반환 필드:
      success: bool
      name, price: 상품명/가격
      out_of_stock: True → 품절
      discontinued: True → 판매중단 ("현재 판매중인 상품이 아닙니다" 등)
      uncertain: True → 구매/품절/판매중단 신호 모두 미감지 (직접 확인 권장)
    """
    if _is_manual_check(url):
        return _manual_check_result()

    if _is_gmarket(url) and not GMARKET_PROFILE_DIR.exists():
        print("    [G마켓] 브라우저 프로필 없음 → venv/bin/python save_cookies_gmarket.py 먼저 실행")
        return _manual_check_result()

    async with async_playwright() as p:
        if _is_gmarket(url):
            browser = None
            # headless=False: Cloudflare가 headless 전용 property를 감지하므로
            # 창이 잠깐 열렸다 닫히지만 Mac Mini 로컬 환경에서 실용적
            context = await p.chromium.launch_persistent_context(
                str(GMARKET_PROFILE_DIR),
                headless=False,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
                user_agent=USER_AGENT,
            )
        else:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=USER_AGENT)

        page = await context.new_page()

        try:
            await page.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)

            final_url = page.url
            is_gmarket = _is_gmarket(url) or _is_gmarket(final_url)

            # G마켓 프로필 만료 감지
            if is_gmarket:
                title = await page.title()
                if "Just a moment" in title:
                    print("    [G마켓] 프로필 만료 — Cloudflare 재차단. save_cookies_gmarket.py 재실행 필요")
                    return _manual_check_result()

            # ── 상품명 추출 ──────────────────────────────────────────────
            name: Optional[str] = None
            og_title_el = await page.query_selector('meta[property="og:title"]')
            if og_title_el:
                og_title = await og_title_el.get_attribute("content")
                if og_title:
                    name = og_title.strip()
                    if is_gmarket:
                        for prefix in ("G마켓-", "G마켓 -"):
                            if name.startswith(prefix):
                                name = name[len(prefix):].strip()
                                break

            # ── 페이지 전체 텍스트 1회 수집 (가격 추출 + 판매중단 감지 공용) ──
            body_text: Optional[str] = None
            try:
                body_text = await page.inner_text("body")
            except Exception:
                pass

            # ── 가격 추출 단계 1: og:description ──────────────────────────
            price: Optional[int] = None
            og_desc_el = await page.query_selector('meta[property="og:description"]')
            if og_desc_el:
                og_desc = await og_desc_el.get_attribute("content")
                if og_desc:
                    price = _extract_price(og_desc)

            # ── 가격 추출 단계 2: CSS 셀렉터 ─────────────────────────────
            if price is None:
                for selector in ["strong.price_real", ".price_area strong", ".price_value", ".sell_price"]:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            price = _extract_price(await element.inner_text())
                            if price is not None:
                                break
                    except Exception:
                        continue

            # ── 가격 추출 단계 3: 페이지 전체 텍스트 ──────────────────────
            if price is None and body_text:
                price = _extract_price(body_text)

            # ── 재고 상태 판단 ─────────────────────────────────────────────
            # 우선순위:
            #   1) "구매하기" 버튼 활성 → 판매중 (in_stock)
            #   2) 판매중단 문구 존재 → 판매중단 (discontinued)
            #   3) "품절" 버튼 존재 → 품절 (out_of_stock)
            #   4) 셋 모두 미감지 → 확인필요 (uncertain) — 안전 우선, 판매중 가정하지 않음

            # Step 1: 구매하기 버튼
            buy_button_found = False
            buy_button_signal = "없음"
            for selector in [
                'button:has-text("구매하기")',
                'a:has-text("구매하기")',
                'em:has-text("구매하기")',  # G마켓
                ".btn_buy", "#buyBtn", "#btn_buy",
            ]:
                try:
                    el = await page.query_selector(selector)
                    if el and await el.is_visible():
                        if (await el.get_attribute("disabled")) is None and \
                           (await el.get_attribute("aria-disabled")) != "true":
                            buy_button_found = True
                            buy_button_signal = selector
                            break
                except Exception:
                    continue

            # Step 2: 판매중단 문구 (본문 텍스트)
            discontinued_found = False
            discontinued_signal = "없음"
            if body_text:
                for phrase in DISCONTINUED_PHRASES:
                    if phrase in body_text:
                        discontinued_found = True
                        discontinued_signal = phrase
                        break

            # Step 3: 품절 버튼
            sold_out_found = False
            sold_out_signal = "없음"
            for selector in [
                'button:has-text("품절")',
                'em:has-text("품절")',  # G마켓
                ".btn_soldout",
                "[class*='soldOut']",
            ]:
                try:
                    el = await page.query_selector(selector)
                    if el and await el.is_visible():
                        sold_out_found = True
                        sold_out_signal = selector
                        break
                except Exception:
                    continue

            # Step 4: 최종 판단 (구매하기 우선, 판매중단·품절은 상호 배타)
            if buy_button_found:
                out_of_stock = False
                discontinued = False
                uncertain = False
                status_label = "판매중"
            elif discontinued_found:
                out_of_stock = False
                discontinued = True
                uncertain = False
                status_label = f"판매중단({discontinued_signal})"
            elif sold_out_found:
                out_of_stock = True
                discontinued = False
                uncertain = False
                status_label = "품절"
            else:
                out_of_stock = False
                discontinued = False
                uncertain = True
                status_label = "확인필요(신호없음)"

            print(
                f"    [재고감지] 구매={buy_button_signal} | "
                f"판매중단={discontinued_signal} | "
                f"품절={sold_out_signal} → {status_label}"
            )

            return {
                "success": True,
                "name": name,
                "price": price,
                "out_of_stock": out_of_stock,
                "discontinued": discontinued,
                "uncertain": uncertain,
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

        finally:
            if browser is not None:
                await browser.close()
            else:
                await context.close()
