"""Playwright 기반 가격 스크래퍼 (11번가/G마켓/옥션/롯데온/LG닷컴 지원, 쿠팡 수동확인)"""
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

# 쿠팡: Akamai WAF edgesuite 차단 확인됨 — headless=False도 불가, 수동확인 유지
MANUAL_CHECK_DOMAINS = frozenset(["coupang.com"])

# G마켓/옥션: Cloudflare 우회용 persistent context 프로필 디렉토리
GMARKET_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"
AUCTION_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_auction"

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


def _is_manual_check(url: str) -> bool:
    """Akamai WAF 완전 차단 도메인 확인"""
    return any(d in urlparse(url).netloc.lower() for d in MANUAL_CHECK_DOMAINS)


def _is_gmarket(url: str) -> bool:
    return "gmarket.co.kr" in urlparse(url).netloc.lower()


def _is_auction(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return "auction.co.kr" in host or "auction.kr" in host


def _is_lotteon(url: str) -> bool:
    return "lotteon.com" in urlparse(url).netloc.lower()


def _is_lgcom(url: str) -> bool:
    return "lge.co.kr" in urlparse(url).netloc.lower()


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
    """상품 URL에서 가격·품절·상품명 추출. 반환: success/name/price/out_of_stock/discontinued/uncertain/manual_check"""
    # 쿠팡: Akamai WAF 차단 확인됨 → 즉시 수동확인 반환
    if _is_manual_check(url):
        return _manual_check_result()

    # 프로필 없는 사이트: 수동확인 폴백
    if _is_gmarket(url) and not GMARKET_PROFILE_DIR.exists():
        print("    [G마켓] 프로필 없음 → venv/bin/python save_cookies_gmarket.py 먼저 실행")
        return _manual_check_result()
    if _is_auction(url) and not AUCTION_PROFILE_DIR.exists():
        print("    [옥션] 프로필 없음 → venv/bin/python save_cookies_auction.py 먼저 실행")
        return _manual_check_result()

    async with async_playwright() as p:
        browser = None
        if _is_gmarket(url):
            context = await _make_persistent_context(p, GMARKET_PROFILE_DIR)
        elif _is_auction(url):
            context = await _make_persistent_context(p, AUCTION_PROFILE_DIR)
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
            is_lotteon = _is_lotteon(url) or _is_lotteon(final_url)
            is_lgcom   = _is_lgcom(url)   or _is_lgcom(final_url)

            # Cloudflare 재차단 감지 (프로필 만료 시 폴백)
            if is_gmarket or is_auction:
                title = await page.title()
                if "Just a moment" in title or "봇" in title:
                    site = "G마켓" if is_gmarket else "옥션"
                    script = "save_cookies_gmarket.py" if is_gmarket else "save_cookies_auction.py"
                    print(f"    [{site}] 프로필 만료 → {script} 재실행 필요")
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
                    # 롯데온 og:title은 "[브랜드]상품명 : 롯데ON" 형식
                    if is_lotteon:
                        name = re.sub(r'^\[[^\]]+\]\s*', '', name)
                        if ' : 롯데ON' in name:
                            name = name[:name.index(' : 롯데ON')].strip()
                    # LG닷컴 og:title은 "상품명 | 모델번호 | LG전자" 형식
                    if is_lgcom and ' | LG전자' in name:
                        name = name[:name.index(' | LG전자')].strip()

            # ── 페이지 전체 텍스트 1회 수집 (가격·판매중단 감지 공용) ────
            body_text: Optional[str] = None
            try:
                body_text = await page.inner_text("body")
            except Exception:
                pass

            # ── 가격 1: 사이트별 전용 추출 ──────────────────────────────
            price: Optional[int] = None
            # LG닷컴: 타임딜/회원/기타 할인가 우선, 없으면 정가 폴백
            if is_lgcom:
                lge_raw = await page.evaluate(
                    """() => {
                        const its = document.querySelectorAll(
                            '.price-detail .price-detail-item:not(.type-small-dept)'
                            + ':not(.coupon-detail-item)');
                        for (const li of its) {
                            const dl = li.querySelector('dl');
                            if (dl && dl.innerText.includes('할인가')) {
                                const sp = li.querySelector('.price');
                                if (sp) return sp.innerText;
                            }
                        }
                        const reg = document.querySelector(
                            '.price-detail-item.type-small-dept dl');
                        return reg ? reg.innerText : null;
                    }"""
                )
                if lge_raw:
                    price = _extract_price(lge_raw)
            # 롯데온: 혜택가(.advantageBox__top--price) → 정가(.pd-price__info--number)
            if is_lotteon and price is None:
                for sel in [".advantageBox__top--price", ".pd-price__info--number"]:
                    try:
                        el = await page.query_selector(sel)
                        if el:
                            price = _extract_price(await el.inner_text())
                            if price is not None:
                                break
                    except Exception:
                        continue

            # ── 가격 2: og:description (11번가 등) ──────────────────────
            if price is None:
                _od = await page.query_selector('meta[property="og:description"]')
                if _od:
                    _oc = await _od.get_attribute("content")
                    if _oc:
                        price = _extract_price(_oc)

            # ── 가격 3: CSS 셀렉터 (11번가 등) ──────────────────────────
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

            # ── 가격 4: 본문 전체 ────────────────────────────────────────
            if price is None and body_text:
                price = _extract_price(body_text)

            # ── 재고 상태 판단 (우선순위: 구매버튼→판매중단→품절→uncertain) ──
            buy_button_found = False
            buy_button_signal = "없음"
            for sel in [
                'button:has-text("구매하기")', 'a:has-text("구매하기")',
                'em:has-text("구매하기")',       # G마켓
                "#buyNow", ".btnBuy",           # 옥션
                ".btn_buy", "#buyBtn", "#btn_buy",
                'a.btn.cart', '.item__button--cart',  # LG닷컴 (장바구니 담기)
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
