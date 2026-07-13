"""네이버 스마트스토어 가격 스크래퍼

channel="chrome" + browser_profile_naver/ 로그인 프로필 필수.
headless=False 필수 (네이버 봇 감지 우회).
span.weP_mymkqG 여러 개 중 최솟값 = 나의 할인가 추출 (2026-07 확인).
"""
import re
from typing import Optional

from scraper_common import retry_until_stable

PRICE_MIN = 10_000
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


async def scrape_naver(page) -> dict:
    """이미 열린 Playwright page에서 네이버 스마트스토어 상품 정보 추출."""
    name: Optional[str] = None
    price: Optional[int] = None

    # 로그인/캡차 페이지 리다이렉트 감지
    current_url = page.url
    page_title = await page.title()
    if ("nidlogin" in current_url or "naver.com/login" in current_url
            or page_title.strip() == "네이버 로그인"):
        return {
            "success": True, "manual_check": True,
            "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False,
        }

    # 상품명: og:title → " : 스토어명" 같은 접미어 제거
    og = await page.query_selector('meta[property="og:title"]')
    if og:
        raw = await og.get_attribute("content")
        if raw:
            name = _clean_name(raw)
    if not name and page_title:
        name = _clean_name(page_title)

    # JS 렌더링 대기 (React SPA: domcontentloaded 후 가격 요소가 늦게 삽입됨)
    try:
        await page.wait_for_selector("span.weP_mymkqG", timeout=5000)
    except Exception:
        pass

    # 최종가: span.weP_mymkqG 전부 수집 → 최솟값 (나의 할인가)
    # 일반가 span이 할인가 span보다 먼저 렌더링되는 경우가 있어(동시 실행 부하 시
    # 특히 심함), 2개 이상 잡힐 때까지 짧게 재시도한다.
    async def _attempt_price():
        try:
            els = await page.query_selector_all("span.weP_mymkqG")
            candidates = [_extract_price(await el.inner_text()) for el in els]
            candidates = [p for p in candidates if p]
        except Exception:
            candidates = []
        value = min(candidates) if candidates else None
        return value, len(candidates) >= 2

    price = await retry_until_stable(_attempt_price)

    # 폴백 1: span.JgXeZNueV6 (비로그인 상태 일반 판매가)
    if price is None:
        for sel in ["span.JgXeZNueV6", ".salePrice"]:
            try:
                el = await page.query_selector(sel)
                if el:
                    v = _extract_price(await el.inner_text())
                    if v:
                        price = v
                        break
            except Exception:
                continue

    # 폴백 2: og:description 에서 가격 패턴 추출
    if price is None:
        od = await page.query_selector('meta[property="og:description"]')
        if od:
            content = await od.get_attribute("content")
            if content:
                m = re.search(r'([\d,]+)\s*원', content)
                if m:
                    v = int(m.group(1).replace(',', ''))
                    if PRICE_MIN <= v <= PRICE_MAX:
                        price = v

    # 재고 판단: 구매 버튼 탐색
    buy_found = False
    for sel in [
        'button:has-text("구매하기")', 'button:has-text("바로구매")',
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

    soldout_found = False
    for sel in ['button:has-text("품절")', ".btn_soldout", "[class*='soldOut']"]:
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
