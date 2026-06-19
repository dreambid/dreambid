"""Playwright 기반 가격 스크래퍼 (11번가/G마켓/옥션/쿠팡 지원)"""
import os
import re
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
from playwright.async_api import async_playwright, BrowserContext

# Mac Chrome 최신 버전 User-Agent
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

TIMEOUT_MS = 30_000
PRICE_MIN = 100
PRICE_MAX = 100_000_000

# save_cookies_*.py 가 생성하는 Chromium 프로필 디렉토리
GMARKET_PROFILE_DIR  = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"
AUCTION_PROFILE_DIR  = Path(os.path.dirname(__file__)) / "browser_profile_auction"
COUPANG_PROFILE_DIR  = Path(os.path.dirname(__file__)) / "browser_profile_coupang"

# 명시적 판매중단 문구 (페이지 본문에서 탐색)
DISCONTINUED_PHRASES = [
    "현재 판매중인 상품이 아닙니다",
    "판매가 중지된 상품",
    "판매중지된 상품",
    "판매 중지된 상품",
]


def _extract_price(text: str) -> Optional[int]:
    """텍스트에서 '원' 앞 숫자 추출. 유효 범위 내 첫 번째 값 반환."""
    matches = re.findall(r"([\d,]+)\s*원", text)
    for m in matches:
        try:
            price = int(m.replace(",", ""))
            if PRICE_MIN <= price <= PRICE_MAX:
                return price
        except ValueError:
            continue
    return None


def _is_coupang(url: str) -> bool:
    return "coupang.com" in urlparse(url).netloc.lower()


def _is_gmarket(url: str) -> bool:
    return "gmarket.co.kr" in urlparse(url).netloc.lower()


def _is_auction(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return "auction.co.kr" in host or "auction.kr" in host


def _manual_check_result() -> dict:
    return {"success": True, "manual_check": True, "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False}


async def _make_persistent_context(p, profile_dir: Path) -> BrowserContext:
    """G마켓/옥션 공용: Cloudflare 우회를 위해 headless=False + 저장된 프로필 사용"""
    return await p.chromium.launch_persistent_context(
        str(profile_dir),
        headless=False,
        args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        user_agent=USER_AGENT,
    )


async def scrape_product(url: str) -> dict:
    """
    상품 URL에서 가격, 품절 여부, 상품명 추출.

    반환 필드:
      success, name, price
      out_of_stock: True → 품절
      discontinued: True → 판매중단
      uncertain: True → 신호 미감지 (직접 확인 권장)
      manual_check: True → WAF 차단 도메인 (쿠팡)
    """
    # 프로필 없는 사이트: 수동확인 폴백
    if _is_gmarket(url) and not GMARKET_PROFILE_DIR.exists():
        print("    [G마켓] 프로필 없음 → venv/bin/python save_cookies_gmarket.py 먼저 실행")
        return _manual_check_result()
    if _is_auction(url) and not AUCTION_PROFILE_DIR.exists():
        print("    [옥션] 프로필 없음 → venv/bin/python save_cookies_auction.py 먼저 실행")
        return _manual_check_result()
    if _is_coupang(url) and not COUPANG_PROFILE_DIR.exists():
        print("    [쿠팡] 프로필 없음 → venv/bin/python save_cookies_coupang.py 먼저 실행")
        return _manual_check_result()

    async with async_playwright() as p:
        browser = None
        if _is_gmarket(url):
            context = await _make_persistent_context(p, GMARKET_PROFILE_DIR)
        elif _is_auction(url):
            context = await _make_persistent_context(p, AUCTION_PROFILE_DIR)
        elif _is_coupang(url):
            context = await _make_persistent_context(p, COUPANG_PROFILE_DIR)
        else:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=USER_AGENT)

        page = await context.new_page()

        try:
            await page.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)

            final_url = page.url
            is_gmarket = _is_gmarket(url) or _is_gmarket(final_url)
            is_auction = _is_auction(url) or _is_auction(final_url)
            is_coupang = _is_coupang(url) or _is_coupang(final_url)

            # WAF/Cloudflare 재차단 감지 (프로필 만료 시 폴백)
            if is_gmarket or is_auction or is_coupang:
                title = await page.title()
                blocked = (
                    "Just a moment" in title or "봇" in title       # Cloudflare
                    or "Robot Check" in title or "Access Denied" in title  # Akamai
                    or "403" in title
                )
                if blocked:
                    if is_gmarket:
                        site, script = "G마켓", "save_cookies_gmarket.py"
                    elif is_auction:
                        site, script = "옥션", "save_cookies_auction.py"
                    else:
                        site, script = "쿠팡", "save_cookies_coupang.py"
                    print(f"    [{site}] WAF 차단 감지 → {script} 재실행 필요")
                    return _manual_check_result()

            # ── 상품명 ──────────────────────────────────────────────────
            name: Optional[str] = None
            og_title_el = await page.query_selector('meta[property="og:title"]')
            if og_title_el:
                og_title = await og_title_el.get_attribute("content")
                if og_title:
                    name = og_title.strip()
                    # G마켓 og:title은 "G마켓-상품명" 형식
                    if is_gmarket:
                        for prefix in ("G마켓-", "G마켓 -"):
                            if name.startswith(prefix):
                                name = name[len(prefix):].strip()
                                break

            # ── 페이지 전체 텍스트 1회 수집 (가격·판매중단 감지 공용) ────
            body_text: Optional[str] = None
            try:
                body_text = await page.inner_text("body")
            except Exception:
                pass

            # ── 가격 1: og:description ───────────────────────────────────
            price: Optional[int] = None
            og_desc_el = await page.query_selector('meta[property="og:description"]')
            if og_desc_el:
                og_desc = await og_desc_el.get_attribute("content")
                if og_desc:
                    price = _extract_price(og_desc)

            # ── 가격 2: CSS 셀렉터 ───────────────────────────────────────
            if price is None:
                for sel in ["strong.price_real", ".price_area strong",
                            ".ItemPrice", ".price_value", ".sell_price"]:
                    try:
                        el = await page.query_selector(sel)
                        if el:
                            price = _extract_price(await el.inner_text())
                            if price is not None:
                                break
                    except Exception:
                        continue

            # ── 가격 3: 본문 전체 ────────────────────────────────────────
            if price is None and body_text:
                price = _extract_price(body_text)

            # ── 재고 상태 판단 ───────────────────────────────────────────
            # 우선순위:
            #   1) 구매하기 버튼 활성 → in_stock
            #   2) 판매중단 문구     → discontinued
            #   3) 품절 버튼        → out_of_stock
            #   4) 미감지           → uncertain (안전 우선)

            buy_button_found = False
            buy_button_signal = "없음"
            for sel in [
                'button:has-text("구매하기")', 'a:has-text("구매하기")',
                'em:has-text("구매하기")',       # G마켓
                "#buyNow", ".btnBuy",           # 옥션
                ".btn_buy", "#buyBtn", "#btn_buy",
            ]:
                try:
                    el = await page.query_selector(sel)
                    if el and await el.is_visible():
                        if (await el.get_attribute("disabled")) is None and \
                           (await el.get_attribute("aria-disabled")) != "true":
                            buy_button_found = True
                            buy_button_signal = sel
                            break
                except Exception:
                    continue

            discontinued_found = False
            discontinued_signal = "없음"
            if body_text:
                for phrase in DISCONTINUED_PHRASES:
                    if phrase in body_text:
                        discontinued_found = True
                        discontinued_signal = phrase
                        break

            sold_out_found = False
            sold_out_signal = "없음"
            for sel in [
                'button:has-text("품절")', 'em:has-text("품절")',
                ".btn_soldout", "[class*='soldOut']",
            ]:
                try:
                    el = await page.query_selector(sel)
                    if el and await el.is_visible():
                        sold_out_found = True
                        sold_out_signal = sel
                        break
                except Exception:
                    continue

            if buy_button_found:
                out_of_stock, discontinued, uncertain = False, False, False
                status_label = "판매중"
            elif discontinued_found:
                out_of_stock, discontinued, uncertain = False, True, False
                status_label = f"판매중단({discontinued_signal})"
            elif sold_out_found:
                out_of_stock, discontinued, uncertain = True, False, False
                status_label = "품절"
            else:
                out_of_stock, discontinued, uncertain = False, False, True
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
