"""SSG.COM 가격 스크래퍼

headless=True 정상 동작 확인됨 (봇 차단 없음).
최적가(em.ssg_price) 추출 — 할인가 우선, 정가·최고판매가 무시.

단일 시도 정책 (2026-07-21): retry_until_stable을 쓰지 않는다. SSG가 IP
차단 상태일 때 매시간 "찔러보는" 재시도 자체가 WAF 입장에서 봇 트래픽으로
누적되어 차단이 오히려 10일 넘게 유지되는 원인으로 지목됨 — 한 사이클에
한 번만 접속하고, 차단 감지 시 그 자리에서 재시도 없이 바로 물러난다.
"""
import re
from typing import Optional

PRICE_MIN = 100
PRICE_MAX = 100_000_000

# 본문 폴백(셀렉터가 다 실패했을 때 body 전체에서 숫자를 긁는 경로)에서만 쓰는 추가
# 방어선. "원"도 안 붙은 숫자를 다 허용하던 기존 _extract_price가 IP 차단 페이지의
# 안내문 속 숫자(예: 700)를 가격으로 오인식한 사례가 있어, 본문 폴백에는 "원" 접미사를
# 요구하고 이 금액 미만은 의심값으로 버린다 (실제 가전 최저가가 이보다 낮은 경우는 없음).
BODY_FALLBACK_MIN = 10_000

_SSG_SUFFIX = " - SSG.COM"
_SITE_CODE_RE = re.compile(r"^[A-Z]\]\[")  # 예: "S][" → "["

# SSG WAF가 봇으로 판단해 띄우는 차단 안내 페이지의 고정 문구 (실제 확인된 문구 기준)
_BLOCK_PHRASES = ["비정상적인 접근", "자동화된 환경"]


def _clean_name(raw: str) -> str:
    if _SSG_SUFFIX in raw:
        raw = raw[: raw.index(_SSG_SUFFIX)]
    raw = _SITE_CODE_RE.sub("[", raw.strip())
    return raw.strip()


def _is_blocked_page(body_text: str) -> bool:
    return any(phrase in body_text for phrase in _BLOCK_PHRASES)


def _blocked_result() -> dict:
    return {"success": True, "blocked": True, "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False}


def _discontinued_result() -> dict:
    return {"success": True, "name": None, "price": None,
            "out_of_stock": False, "discontinued": True, "uncertain": False}


def _extract_price(text: str) -> Optional[int]:
    """셀렉터로 정확히 짚은 가격 요소의 텍스트에서 추출 — 요소 자체가 신뢰할 수 있으므로
    "원" 접미사를 요구하지 않는다(기존 동작 유지)."""
    for m in re.findall(r"([\d,]+)", text):
        try:
            v = int(m.replace(",", ""))
            if PRICE_MIN <= v <= PRICE_MAX:
                return v
        except ValueError:
            continue
    return None


def _extract_price_strict(text: str) -> Optional[int]:
    """본문 전체 폴백 전용 — 어디서 온 숫자인지 알 수 없으므로 "원" 접미사를 필수로
    요구하고, BODY_FALLBACK_MIN 미만은 오탐(차단 페이지 등)으로 간주해 버린다."""
    for m in re.findall(r"([\d,]+)\s*원", text):
        try:
            v = int(m.replace(",", ""))
            if BODY_FALLBACK_MIN <= v <= PRICE_MAX:
                return v
        except ValueError:
            continue
    return None


async def scrape_ssg(page, response=None) -> dict:
    """이미 열린 Playwright page에서 SSG.COM 상품 정보 추출. 재시도 없이 단 1회만 시도한다.

    response는 scraper.py의 page.goto() 반환값(HTTP 응답)을 그대로 넘겨받아
    403 여부도 차단 신호로 함께 확인한다(선택 인자 — 없으면 본문 문구만으로 판단)."""
    name: Optional[str] = None
    price: Optional[int] = None

    # WAF 차단 안내 페이지 감지: 맞으면 가격/재고 추출을 시도하지 않고 즉시 반환
    # (블록 상태 집계는 main.py가 연속 감지 횟수를 세어 처리한다). HTTP 403과
    # 본문 차단 문구를 OR로 함께 확인 — 재시도는 하지 않는다.
    try:
        block_check_text = await page.inner_text("body")
    except Exception:
        block_check_text = ""
    is_403 = response is not None and response.status == 403
    if is_403 or _is_blocked_page(block_check_text):
        return _blocked_result()

    # 판매종료 상품 감지: SSG는 삭제된 itemId에 대해 alert('판매가 종료된 상품입니다.')
    # 후 location.href="/"로 홈에 리다이렉트하는 JS를 내려준다. Playwright는 이 JS를
    # 실제로 실행하므로, 상세페이지(itemView.ssg)에서 벗어났다면 홈 화면의 프로모션
    # 배너 등 무관한 숫자를 상품 가격으로 잘못 수집하기 전에 판매중단으로 처리한다.
    if "itemView.ssg" not in page.url:
        return _discontinued_result()

    # 상품명: og:title에서 사이트 접미어·채널 코드 제거
    og = await page.query_selector('meta[property="og:title"]')
    if og:
        raw = await og.get_attribute("content")
        if raw:
            name = _clean_name(raw)

    # 최적가(할인가): em.ssg_price — SSG 공식 최종가 셀렉터. 재시도 없이 단 1회만 시도.
    price_el = await page.query_selector("em.ssg_price")
    if price_el:
        price = _extract_price(await price_el.inner_text())

    # 폴백: span.cdtl_price.point
    if price is None:
        el = await page.query_selector("span.cdtl_price.point")
        if el:
            price = _extract_price(await el.inner_text())

    # 폴백2: body 전체 — "원" 접미사 필수 + 최소금액 검증(_extract_price_strict).
    # 위에서 이미 읽어둔 block_check_text를 재사용해 body를 다시 조회하지 않는다.
    if price is None:
        price = _extract_price_strict(block_check_text)

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
