"""11번가 쿠폰 최대할인가 조회 헬퍼 (비로그인 공개 API)"""
import re
import requests
from typing import Optional

_COUPON_API = "https://m.11st.co.kr/MW/coupon/V1/couponSectionHtml.tmall"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.11st.co.kr/",
}
_COUPON_AMOUNT_RE = re.compile(
    r'r-couponbox__price.*?<strong[^>]*>([\d,]+)', re.DOTALL
)


def _fetch_11st_coupon_discount(c: Optional[dict]) -> Optional[int]:
    """productCouponDownInfo 딕셔너리로 쿠폰 최대할인액 반환. 실패 시 None."""
    if not c or not (c.get("downloadCupnCnt", 0) or c.get("dupCupnListCnt", 0)):
        return None
    url = (
        f"{_COUPON_API}"
        f"?prdNo={c['prdNo']}&selPrc={c['selPrc']}"
        f"&xsiteCode={c['xsiteCode']}&wireCode={c['wireCode']}"
        f"&engCpnView=N&dscCupnIssNo={c['dscCupnIssNo']}&dscCupnCalcAmt={c['dscCupnCalcAmt']}"
        f"&dupCupnIssNo={c['dupCupnIssNo']}&dupCupnCalcAmt={c['dupCupnCalcAmt']}"
        f"&downloadCupnCnt={c['downloadCupnCnt']}&dscCupnListCnt={c['dscCupnListCnt']}"
        f"&dupCupnListCnt={c['dupCupnListCnt']}&addPrc=0&optionPrice=0"
    )
    try:
        r = requests.get(url, headers=_HEADERS, timeout=8)
        html = r.json().get("couponSectionHtml", "") if r.ok else ""
        total = sum(int(a.replace(",", "")) for a in _COUPON_AMOUNT_RE.findall(html))
        return total or None
    except Exception:
        return None
