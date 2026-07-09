"""네이버 스마트스토어(smartstore.naver.com / brand.naver.com) 가격 스크래퍼

headless=False로 봇 차단 우회.
가격: window.__PRELOADED_STATE__ JSON 우선 → DOM → body 폴백
"""
import json
import re
from typing import Optional

PRICE_MIN = 100
PRICE_MAX = 100_000_000

DISCONTINUED_PHRASES = ["판매중지", "판매가 중지", "판매 중지된 상품"]


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


async def scrape_naver(page) -> dict:
    """이미 열린 Playwright page에서 네이버 스마트스토어 상품 정보 추출."""
    name: Optional[str] = None
    price: Optional[int] = None

    # 상품명: og:title
    og_el = await page.query_selector('meta[property="og:title"]')
    if og_el:
        og_val = await og_el.get_attribute("content")
        if og_val:
            name = og_val.strip()

    # 가격: __PRELOADED_STATE__ JSON 우선
    raw_state = await page.evaluate("""() => {
        try { return JSON.stringify(window.__PRELOADED_STATE__); }
        catch(e) { return null; }
    }""")
    if raw_state:
        try:
            state = json.loads(raw_state)
            # 경로 1: product.<key>.salePrice / discountedSalePrice
            product_map = state.get("product", {})
            for val in product_map.values():
                if not isinstance(val, dict):
                    continue
                for field in ("discountedSalePrice", "salePrice"):
                    candidate = val.get(field)
                    if candidate and PRICE_MIN <= int(candidate) <= PRICE_MAX:
                        price = int(candidate)
                        break
                if price is not None:
                    break
            # 경로 2: ProductOption 옵션 조합 최솟값
            if price is None:
                combos = (state.get("ProductOption", {})
                               .get("optionCombinations", []))
                prices = [
                    int(c["price"])
                    for c in combos
                    if isinstance(c.get("price"), (int, float))
                    and PRICE_MIN <= int(c["price"]) <= PRICE_MAX
                ]
                if prices:
                    price = min(prices)
        except (json.JSONDecodeError, TypeError, ValueError, KeyError):
            pass

    # 가격: DOM 폴백 (obfuscated 클래스는 변하므로 텍스트 기반 우선)
    if price is None:
        for sel in [
            '._2AeUfXOEGj',
            '._1LY7DqCnwR',
            '.WrkQGDLb7j',
            '.price_num',
            '[class*="salePrice"]',
            '[class*="price_area"] strong',
        ]:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    p = _extract_price(await el.inner_text())
                    if p is not None:
                        price = p
                        break
            except Exception:
                continue

    # 가격: og:description 폴백
    if price is None:
        od_el = await page.query_selector('meta[property="og:description"]')
        if od_el:
            oc = await od_el.get_attribute("content")
            if oc:
                price = _extract_price(oc)

    # 가격: body 전체 폴백
    body_text: Optional[str] = None
    if price is None:
        try:
            body_text = await page.inner_text("body")
            price = _extract_price(body_text)
        except Exception:
            pass

    # body_text 재사용을 위해 아직 없으면 한 번만 수집
    if body_text is None:
        try:
            body_text = await page.inner_text("body")
        except Exception:
            body_text = ""

    # 재고 판단: 구매/바로구매 버튼
    buy_found = False
    for sel in [
        'button:has-text("구매하기")',
        'button:has-text("바로구매")',
        'a:has-text("구매하기")',
        '._2-I30XS1lA',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                if (await el.get_attribute("disabled")) is None and \
                   (await el.get_attribute("aria-disabled")) != "true":
                    buy_found = True
                    break
        except Exception:
            continue

    soldout_found = False
    for sel in [
        'button:has-text("품절")',
        'span:has-text("품절")',
        '[class*="soldOut"]',
        '[class*="sold_out"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                soldout_found = True
                break
        except Exception:
            continue

    discontinued_found = any(p in body_text for p in DISCONTINUED_PHRASES) if body_text else False

    if buy_found:
        out_of_stock, discontinued, uncertain = False, False, False
    elif discontinued_found:
        out_of_stock, discontinued, uncertain = False, True, False
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
