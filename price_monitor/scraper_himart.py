"""하이마트(e-himart.co.kr) 가격 스크래퍼

최대혜택가 우선 추출 → 없으면 .hm-goods__price-final 폴백
봇 차단 없음(headless=True 동작 확인됨)
"""
import re
from typing import Optional

PRICE_MIN = 100
PRICE_MAX = 100_000_000


def _extract_price(text: str) -> Optional[int]:
    matches = re.findall(r"([\d,]+)\s*원", text)
    for m in matches:
        try:
            price = int(m.replace(",", ""))
            if PRICE_MIN <= price <= PRICE_MAX:
                return price
        except ValueError:
            continue
    return None


async def scrape_himart(page) -> dict:
    """이미 열린 Playwright page에서 하이마트 상품 정보 추출."""
    name: Optional[str] = None
    price: Optional[int] = None

    # 상품명: .hm-goods-name 우선 (og:title/title은 "롯데하이마트"만 반환하는 경우 있음)
    name_el = await page.query_selector(".hm-goods-name")
    if name_el:
        txt = (await name_el.inner_text()).strip()
        if txt:
            name = txt

    # 폴백: page title에서 " | " 이후 추출
    if not name:
        title = await page.title()
        if " | " in title:
            candidate = title.split(" | ", 1)[1].strip()
            if candidate and candidate != "롯데하이마트":
                name = candidate

    # 최대혜택가 우선 추출
    benefit_el = await page.query_selector(".hm-view-more__benefit-wrapper")
    if benefit_el:
        raw = await benefit_el.inner_text()
        price = _extract_price(raw)

    # 폴백: 쿠폰 적용 판매가
    if price is None:
        final_el = await page.query_selector(".hm-goods__price-final")
        if final_el:
            raw = await final_el.inner_text()
            price = _extract_price(raw)

    # 폴백2: body 전체 텍스트
    if price is None:
        try:
            body = await page.inner_text("body")
            price = _extract_price(body)
        except Exception:
            pass

    # 재고 판단: 구매하기/바로구매 버튼 존재 여부
    buy_found = False
    for sel in [
        ".hm-purchase-btn",
        'button:has-text("바로구매")',
        'button:has-text("구매하기")',
        'button:has-text("장바구니")',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                if (await el.get_attribute("disabled")) is None:
                    buy_found = True
                    break
        except Exception:
            continue

    # 재고 일시품절 배너: 클래스명이 "abSoldOut"처럼 대문자를 포함해
    # 기존 "[class*='soldOut']"(소문자, 대소문자 구분됨)와 매칭이 안 됨 → 별도 셀렉터 추가
    soldout_found = False
    for sel in [
        ".hm-purchase-tool__sale-disabled",
        ".soldout", "[class*='soldOut']", 'button:has-text("품절")',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                soldout_found = True
                break
        except Exception:
            continue

    # 폴백: 클래스명이 바뀌어도 대비해 배너 문구 자체를 본문에서 확인
    if not soldout_found:
        try:
            body_text = await page.inner_text("body")
            if "재고가 일시 품절된 상품입니다" in body_text:
                soldout_found = True
        except Exception:
            pass

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
