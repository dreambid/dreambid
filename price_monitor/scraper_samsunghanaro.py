"""삼성하나로(samsunghanaro.com) 가격 스크래퍼 — 카페24 계열 개인 쇼핑몰

headless=True 정상 동작 확인됨 (봇 차단 없음).
#priceArea의 data-price 속성 우선 추출 → #span_product_price_text 폴백.
"""
import re
from typing import Optional

PRICE_MIN = 100_000
PRICE_MAX = 100_000_000

_NAME_SEPS = (" : ", " | ", " - ")


def _extract_price(text: str) -> Optional[int]:
    digits = re.sub(r'[^\d]', '', str(text))
    v = int(digits) if digits else None
    return v if v and PRICE_MIN <= v <= PRICE_MAX else None


def _clean_name(raw: str) -> str:
    for sep in _NAME_SEPS:
        if sep in raw:
            return raw.split(sep)[0].strip()
    return raw.strip()


async def scrape_samsunghanaro(page) -> dict:
    """이미 열린 Playwright page에서 삼성하나로 상품 정보 추출."""
    name: Optional[str] = None
    price: Optional[int] = None

    # 상품명: og:title에서 스토어명 접미어 제거
    # (h2는 이 사이트에서 "쇼핑 가이드" 같은 공통 UI 요소를 잘못 잡아서 못 씀)
    og = await page.query_selector('meta[property="og:title"]')
    if og:
        raw = await og.get_attribute("content")
        if raw:
            name = _clean_name(raw)

    # 가격: #priceArea의 data-price 속성이 최종 판매가를 직접 담고 있어 최우선 신뢰
    price_area = await page.query_selector("#priceArea")
    if price_area:
        data_price = await price_area.get_attribute("data-price")
        if data_price:
            price = _extract_price(data_price)

    # 폴백: #span_product_price_text ("원" 접미사 포함 텍스트)
    if price is None:
        el = await page.query_selector("#span_product_price_text")
        if el:
            price = _extract_price(await el.inner_text())

    # 재고 판단: 구매/장바구니 버튼 존재 여부
    buy_found = False
    for sel in [
        "a.btnSubmit",
        'a:has-text("바로구매")',
        'button:has-text("장바구니")',
        'a:has-text("장바구니")',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                if (await el.get_attribute("disabled")) is None:
                    buy_found = True
                    break
        except Exception:
            continue

    # 품절 페이지 실사이트 미확인 — 다른 스크래퍼와 동일한 일반 패턴으로 폴백
    soldout_found = False
    for sel in ['button:has-text("품절")', 'a:has-text("품절")', ".soldout", "[class*='soldOut']"]:
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
