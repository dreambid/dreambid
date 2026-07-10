"""SSG.COM 가격 스크래퍼

headless=True 정상 동작 확인됨 (봇 차단 없음).
최적가(em.ssg_price) 추출 — 할인가 우선, 정가·최고판매가 무시.
"""
import re
from typing import Optional

PRICE_MIN = 100
PRICE_MAX = 100_000_000

_SSG_SUFFIX = " - SSG.COM"
_SITE_CODE_RE = re.compile(r"^[A-Z]\]\[")  # 예: "S][" → "["


def _clean_name(raw: str) -> str:
    if _SSG_SUFFIX in raw:
        raw = raw[: raw.index(_SSG_SUFFIX)]
    raw = _SITE_CODE_RE.sub("[", raw.strip())
    return raw.strip()


def _extract_price(text: str) -> Optional[int]:
    for m in re.findall(r"([\d,]+)", text):
        try:
            v = int(m.replace(",", ""))
            if PRICE_MIN <= v <= PRICE_MAX:
                return v
        except ValueError:
            continue
    return None


async def scrape_ssg(page) -> dict:
    """이미 열린 Playwright page에서 SSG.COM 상품 정보 추출."""
    name: Optional[str] = None
    price: Optional[int] = None

    # 상품명: og:title에서 사이트 접미어·채널 코드 제거
    og = await page.query_selector('meta[property="og:title"]')
    if og:
        raw = await og.get_attribute("content")
        if raw:
            name = _clean_name(raw)

    # 최적가(할인가): em.ssg_price — SSG 공식 최종가 셀렉터
    price_el = await page.query_selector("em.ssg_price")
    if price_el:
        price = _extract_price(await price_el.inner_text())

    # 폴백: span.cdtl_price.point
    if price is None:
        el = await page.query_selector("span.cdtl_price.point")
        if el:
            price = _extract_price(await el.inner_text())

    # 폴백2: body 전체
    if price is None:
        try:
            price = _extract_price(await page.inner_text("body"))
        except Exception:
            pass

    # 재고 판단
    buy_found = False
    for sel in [
        "a.cdtl_btn_buy",
        "a.cdtl_btn_cart",
        'a:has-text("바로구매")',
        'a:has-text("장바구니")',
        'button:has-text("장바구니 담기")',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                if (await el.get_attribute("disabled")) is None:
                    buy_found = True
                    break
        except Exception:
            continue

    # SSG 실제 클래스는 <a class="cdtl_disabled cdtl_btn_soldout">/<a class="cdtl_btn_disabled">
    # (button이 아니라 a 태그, [class*='soldOut']는 대소문자 불일치로 못 잡음 → soldout 소문자로)
    soldout_found = False
    for sel in [
        'button:has-text("품절")',
        'a:has-text("품절")',
        ".cdtl_btn_soldout",
        ".cdtl_btn_disabled",
        ".btn_soldout", "[class*='soldout']",
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                soldout_found = True
                break
        except Exception:
            continue

    if buy_found:
        out_of_stock, discontinued, uncertain = False, False, False
    elif soldout_found:
        out_of_stock, discontinued, uncertain = True, False, False
    else:
        out_of_stock, discontinued, uncertain = False, False, True

    return {
        "success": True,
        "name": name,
        "price": price,
        "out_of_stock": out_of_stock,
        "discontinued": discontinued,
        "uncertain": uncertain,
    }
