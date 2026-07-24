"""네이버 스마트스토어 가격 스크래퍼

channel="chrome" + browser_profile_naver/ 로그인 프로필 필수.
headless=False 필수 (네이버 봇 감지 우회).
.hPxxcpW7TV 여러 개 중 최솟값 = 최대할인가 추출 (2026-07 확인).

색상 기반 이중 확인 (2026-07 추가): .hPxxcpW7TV 범위 안에서 "최대할인가"는
항상 rgb(212, 0, 34)(빨강), 일반가/즉시할인가는 rgb(0, 0, 0)(검정)으로
렌더링됨을 4개 상품·3개 스토어에서 교차 확인. 페이지에 동일한 빨간색을 쓰는
별도 보조 가격 패널(class QNQnOeYmT3 등, 다른 숫자값)이 있는 경우가 있어
색상 검사는 .hPxxcpW7TV로 이미 좁혀진 후보 안에서만 적용한다(페이지 전체
넓은 색상 스캔은 그 보조 패널을 잘못 주울 위험이 있어 하지 않음).

클래스명 변경 메모 (2026-07-24): 네이버가 클래스명을 weP_mymkqG에서
hPxxcpW7TV로 변경, 라벨도 "나의 할인가"에서 "최대할인가"로 변경됨 — 색상
규칙(빨강/검정)은 그대로 유지되어 색상 기반 판별 로직 자체는 안 바꿔도 됐음.
"""
import re
from typing import Optional

from scraper_common import retry_until_stable

PRICE_MIN = 10_000
PRICE_MAX = 100_000_000

# "나의 할인가"(로그인/쿠폰 적용 최종가)를 표시할 때 쓰는 고정 색상값
_MY_DISCOUNT_COLOR = "rgb(212, 0, 34)"

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
        await page.wait_for_selector(".hPxxcpW7TV", timeout=5000)
    except Exception:
        pass

    # 최종가: .hPxxcpW7TV 전부 수집. 클래스+색상 조합으로 "최대할인가"를 우선
    # 신뢰(색상이 빨강인 후보 중 최솟값)하고, 빨간 후보가 없으면 기존처럼 전체 후보 중
    # 최솟값으로 폴백한다(클래스 매칭 방식을 버리지 않고 색상 검사를 덧붙이는 조합).
    # 색상이 텍스트보다 먼저 바뀌는 과도기 오탐 방지: 같은 빨간 값이 재시도 간격
    # (RETRY_DELAY_SECONDS=2초)을 두고 연속 2번 나와야만 안정으로 확정한다(A안).
    # 처음 보는 빨간 값이거나 직전 값과 다르면 무조건 한 번 더 재확인한다.
    _last_red_value: Optional[int] = None

    async def _attempt_price():
        nonlocal _last_red_value
        try:
            raw = await page.evaluate(
                """() => Array.from(document.querySelectorAll('.hPxxcpW7TV')).map(el => ({
                    text: el.innerText,
                    color: getComputedStyle(el).color,
                }))"""
            )
        except Exception:
            raw = []

        candidates = []
        red_candidates = []
        for item in raw:
            v = _extract_price(item.get("text"))
            if not v:
                continue
            candidates.append(v)
            if item.get("color") == _MY_DISCOUNT_COLOR:
                red_candidates.append(v)

        value = min(red_candidates) if red_candidates else (min(candidates) if candidates else None)

        prev_red_value = _last_red_value
        if red_candidates:
            current_red = min(red_candidates)
            is_stable = (current_red == _last_red_value)
            _last_red_value = current_red
        else:
            _last_red_value = None
            is_stable = False

        print(f"[naver price] {name}: 빨간후보={red_candidates}, 검정후보={candidates}, "
              f"직전빨간값={prev_red_value}, 최종값={value}, 안정={is_stable}")

        return value, is_stable

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
