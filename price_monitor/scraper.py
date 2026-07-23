"""Playwright 기반 가격 스크래퍼 (11번가/G마켓/옥션/롯데온/LG닷컴/오늘의집/하이마트/SSG/네이버 스마트스토어/삼성하나로 지원, 쿠팡 수동확인)"""
import json
import os
import re
import time
from datetime import date, datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
from playwright.async_api import async_playwright, BrowserContext
from scraper_11st import _fetch_11st_coupon_discount
from scraper_common import retry_until_stable
from scraper_himart import scrape_himart
from scraper_naver import scrape_naver
from scraper_samsunghanaro import scrape_samsunghanaro
from scraper_ssg import scrape_ssg

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

# SSG 하드 쿨다운 설정 파일 경로 (2026-07-21): 매 사이클 실제 접속을 시도하는
# 것 자체가 WAF에 봇 트래픽으로 누적돼 차단이 오히려 길어진 것으로 판단됨 —
# config.json의 ssg_cooldown_until 날짜가 지날 때까지는 브라우저조차 띄우지
# 않고 즉시 수동확인으로 빠진다.
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

# G마켓/옥션/네이버: Cloudflare/로그인 우회용 persistent context 프로필 디렉토리
GMARKET_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"
AUCTION_PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_auction"
NAVER_PROFILE_DIR   = Path(os.path.dirname(__file__)) / "browser_profile_naver"

# 점검필요(캡차/Cloudflare/로그인 확인)로 열어둔 세션의 Playwright 연결 참조 보관.
# GC로 끊기지 않도록 붙잡아두는 용도 — 사용자가 직접 창을 닫을 때까지 살아있는다.
_OPEN_REVIEW_SESSIONS: list = []

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


def _is_ssg_cooldown() -> bool:
    """config.json의 ssg_cooldown_until(YYYY-MM-DD) 날짜가 아직 안 지났으면 True.
    반드시 date 객체로 파싱해서 비교한다(문자열 사전식 비교 금지 — 포맷이 항상
    YYYY-MM-DD로 고정된다는 보장이 없고, 실수로 다른 포맷이 섞이면 문자열
    비교는 조용히 틀린 결과를 낼 수 있어 명시적 파싱이 안전하다)."""
    try:
        with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        cooldown_str = cfg.get("ssg_cooldown_until")
        if not cooldown_str:
            return False
        cooldown_until = datetime.strptime(cooldown_str, "%Y-%m-%d").date()
        return date.today() < cooldown_until
    except Exception:
        return False


def _is_gmarket(url: str) -> bool: return "gmarket.co.kr" in urlparse(url).netloc.lower()
def _is_auction(url: str) -> bool: n = urlparse(url).netloc.lower(); return "auction.co.kr" in n or "auction.kr" in n
def _is_lotteon(url: str) -> bool: return "lotteon.com" in urlparse(url).netloc.lower()
def _is_lgcom(url: str) -> bool: return "lge.co.kr" in urlparse(url).netloc.lower()
def _is_11st(url: str) -> bool: return "11st.co.kr" in urlparse(url).netloc.lower()
def _is_ohou(url: str) -> bool: n = urlparse(url).netloc.lower(); return "ohou.se" in n or "ozip.me" in n
def _is_himart(url: str) -> bool: return "e-himart.co.kr" in urlparse(url).netloc.lower()
def _is_ssg(url: str) -> bool: return "ssg.com" in urlparse(url).netloc.lower()
def _is_naver(url: str) -> bool: return "smartstore.naver.com" in url.lower()
def _is_samsunghanaro(url: str) -> bool: return "samsunghanaro.com" in urlparse(url).netloc.lower()
def _manual_check_result() -> dict:
    return {"success": True, "manual_check": True, "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False}


def _verification_result(site: str, hint: str) -> dict:
    """캡차/Cloudflare 체크/로그인 화면 등 사람 확인이 필요한 경우의 공통 결과.
    브라우저 창은 닫지 않고 열어두는 것을 전제로 한다 (scrape_product의 leave_open 처리와 짝)."""
    return {"success": True, "verification_needed": True, "verification_site": site,
            "verification_hint": hint, "name": None, "price": None,
            "out_of_stock": False, "discontinued": False, "uncertain": False}


def _profile_locked(profile_dir: Path) -> bool:
    """이미 열려서 점검 대기 중인 persistent 브라우저 창이 있는지 SingletonLock으로 판별.
    (있으면 같은 프로필로 새 창을 또 여는 걸 막아 창이 무한정 쌓이는 걸 방지)

    SingletonLock은 심볼릭 링크이고 타겟이 "호스트명-PID" 형태의 문자열이라
    실제 파일시스템 경로가 아니다. Path.exists()는 심볼릭 링크를 따라가 그
    타겟이 실제로 존재하는 경로인지 확인하므로 항상 False를 반환해 잠금을
    전혀 감지하지 못했다(2026-07-23 발견) — os.path.lexists()로 심볼릭 링크
    자체의 존재만 확인하도록 수정."""
    return os.path.lexists(profile_dir / "SingletonLock")


def _site_label(url: str) -> str:
    if _is_naver(url): return "naver"
    if _is_gmarket(url): return "gmarket"
    if _is_auction(url): return "auction"
    if _is_lotteon(url): return "lotteon"
    if _is_lgcom(url): return "lgcom"
    if _is_11st(url): return "11st"
    if _is_himart(url): return "himart"
    if _is_ssg(url): return "ssg"
    if _is_ohou(url): return "ohou"
    if _is_samsunghanaro(url): return "samsunghanaro"
    return "unknown"


def _diag(url: str, stage: str) -> None:
    """hang 지점 실측용 타임스탬프 로그. 버퍼링되면 실제 정지 지점보다 앞선 로그가
    마지막으로 보일 수 있으므로 flush=True로 매번 즉시 파일에 씀."""
    now = time.time()
    ts = time.strftime("%H:%M:%S", time.localtime(now)) + f".{int(now * 1000) % 1000:03d}"
    print(f"[진단 {ts}] [{_site_label(url)}] {stage} | {url}", flush=True)


async def _make_persistent_context(
    p, profile_dir: Path, channel: Optional[str] = None
) -> BrowserContext:
    kwargs: dict = dict(
        headless=False,
        args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        user_agent=USER_AGENT,
    )
    if channel:
        kwargs["channel"] = channel
    return await p.chromium.launch_persistent_context(str(profile_dir), **kwargs)


async def scrape_product(url: str) -> dict:
    """상품 URL에서 가격·품절·상품명 추출. 반환: success/name/price/out_of_stock/discontinued/uncertain/manual_check"""
    _diag(url, "scrape_product() 진입")
    # 쿠팡: Akamai WAF 차단 확인됨 → 즉시 수동확인 반환
    if _is_manual_check(url):
        return _manual_check_result()

    # SSG 하드 쿨다운: 브라우저를 띄우거나 네트워크 요청을 하기 전에 먼저 확인 —
    # 쿨다운 기간 중엔 접속 시도 자체를 완전히 건너뛴다 (쿠팡과 동일한 하드 스킵
    # 방식이지만, 날짜가 지나면 자동으로 정상 스크래핑으로 복귀한다는 점이 다름)
    if _is_ssg(url) and _is_ssg_cooldown():
        _diag(url, "SSG 쿨다운 기간 — 접속 시도 없이 즉시 수동확인 반환")
        return _manual_check_result()

    if _is_gmarket(url) and not GMARKET_PROFILE_DIR.exists():
        print("    [G마켓] 프로필 없음 → venv/bin/python save_cookies_gmarket.py 먼저 실행")
        return _manual_check_result()
    if _is_auction(url) and not AUCTION_PROFILE_DIR.exists():
        print("    [옥션] 프로필 없음 → venv/bin/python save_cookies_auction.py 먼저 실행")
        return _manual_check_result()
    if _is_naver(url) and not NAVER_PROFILE_DIR.exists():
        print("    [네이버] 프로필 없음 → test_naver.py 먼저 실행해 로그인 세션 저장")
        return _manual_check_result()

    # 이미 점검 대기 중인 창이 열려있으면(SingletonLock) 새로 열지 않고 바로 재알림만
    if _is_gmarket(url) and _profile_locked(GMARKET_PROFILE_DIR):
        return _verification_result("gmarket", "이전에 열어둔 확인 창이 아직 남아있음")
    if _is_auction(url) and _profile_locked(AUCTION_PROFILE_DIR):
        return _verification_result("auction", "이전에 열어둔 확인 창이 아직 남아있음")

    # async_playwright()를 수동으로 start/stop 관리한다 (async with를 쓰면 함수를 벗어날 때
    # 무조건 드라이버 연결이 끊기면서 그 드라이버가 띄운 브라우저도 같이 죽는다 —
    # leave_open=True인 경우 사람이 확인할 때까지 브라우저 창을 살려둬야 하므로
    # 이 경우에만 p.stop()을 건너뛴다).
    _diag(url, "⓪async_playwright().start() 직전 (Node 드라이버 spawn)")
    p = await async_playwright().start()
    _diag(url, "⓪async_playwright().start() 직후")
    browser = None
    leave_open = False
    try:
        if _is_gmarket(url):
            _diag(url, "①②브라우저+persistent context 생성 직전(gmarket)")
            context = await _make_persistent_context(p, GMARKET_PROFILE_DIR)
            _diag(url, "①②브라우저+persistent context 생성 직후(gmarket)")
        elif _is_auction(url):
            _diag(url, "①②브라우저+persistent context 생성 직전(auction)")
            context = await _make_persistent_context(p, AUCTION_PROFILE_DIR)
            _diag(url, "①②브라우저+persistent context 생성 직후(auction)")
        elif _is_naver(url):
            _diag(url, "①②브라우저+persistent context 생성 직전(naver)")
            context = await _make_persistent_context(p, NAVER_PROFILE_DIR, channel="chrome")
            _diag(url, "①②브라우저+persistent context 생성 직후(naver)")
        else:
            _ohou = _is_ohou(url)
            _ssg  = _is_ssg(url)
            _diag(url, "①브라우저 launch 직전")
            browser = await p.chromium.launch(
                headless=not _ohou,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"] if _ohou else ["--no-sandbox"],
            )
            _diag(url, "①브라우저 launch 직후")
            _diag(url, "②context 생성 직전")
            context = await browser.new_context(user_agent=USER_AGENT)
            _diag(url, "②context 생성 직후")

        _diag(url, "③page.new_page() 직전")
        page = await context.new_page()
        _diag(url, "③page.new_page() 직후")

        try:
            _goto_timeout = 10_000 if _is_naver(url) else TIMEOUT_MS
            _diag(url, "④page.goto() 직전")
            _response = await page.goto(url, timeout=_goto_timeout, wait_until="domcontentloaded")
            _diag(url, "④page.goto() 직후")
            await page.wait_for_timeout(500 if _is_naver(url) else 2000)

            final_url = page.url
            is_gmarket = _is_gmarket(url) or _is_gmarket(final_url)
            is_auction = _is_auction(url) or _is_auction(final_url)
            is_lotteon = _is_lotteon(url) or _is_lotteon(final_url)
            is_lgcom   = _is_lgcom(url)   or _is_lgcom(final_url)
            is_11st    = _is_11st(url)    or _is_11st(final_url)
            is_ohou    = _is_ohou(url)    or _is_ohou(final_url)
            is_himart  = _is_himart(url)  or _is_himart(final_url)
            is_ssg     = _is_ssg(url)     or _is_ssg(final_url)
            is_naver   = _is_naver(url)   or _is_naver(final_url)
            is_samsunghanaro = _is_samsunghanaro(url) or _is_samsunghanaro(final_url)

            # 네이버 429(요청 과다) 응답: 알림 없이 수동확인으로 전환
            if is_naver and _response is not None and _response.status == 429:
                return _manual_check_result()

            # 하이마트: 전용 파서로 즉시 반환
            if is_himart:
                _diag(url, "⑤가격추출(himart) 직전")
                himart_result = await scrape_himart(page)
                _diag(url, "⑤가격추출(himart) 직후")
                return himart_result

            # SSG: 전용 파서로 즉시 반환 (403 여부 판단용으로 _response도 함께 전달)
            if is_ssg:
                _diag(url, "⑤가격추출(ssg) 직전")
                ssg_result = await scrape_ssg(page, _response)
                _diag(url, "⑤가격추출(ssg) 직후")
                return ssg_result

            # 삼성하나로: 전용 파서로 즉시 반환
            if is_samsunghanaro:
                _diag(url, "⑤가격추출(samsunghanaro) 직전")
                samsunghanaro_result = await scrape_samsunghanaro(page)
                _diag(url, "⑤가격추출(samsunghanaro) 직후")
                return samsunghanaro_result

            # 네이버 스마트스토어: 전용 파서로 즉시 반환
            # (로그인/캡차 리다이렉트로 manual_check가 나오면 점검필요로 전환, 창은 유지)
            if is_naver:
                _diag(url, "⑤가격추출(naver) 직전")
                naver_result = await scrape_naver(page)
                _diag(url, "⑤가격추출(naver) 직후")
                if naver_result.get("manual_check"):
                    leave_open = True
                    return _verification_result("naver", "로그인/캡차 리다이렉트 감지")
                return naver_result

            # Cloudflare/봇 확인 화면 감지 → 점검필요로 전환, 창은 닫지 않고 사람이 확인할 때까지 유지
            # (영문 Cloudflare "Just a moment"뿐 아니라, G마켓 자체 한글 봇확인 화면
            # "잠시만 기다리십시오…"는 타이틀에 "봇"이 없고 본문에만 있어 별도 폴백 필요)
            if is_gmarket or is_auction:
                title = await page.title()
                body_snippet: Optional[str] = None
                try:
                    body_snippet = await page.inner_text("body")
                except Exception:
                    pass
                _diag(url, f"gmarket/auction title 확인: {title!r}")
                if (
                    "Just a moment" in title
                    or "잠시만 기다리십시오" in title
                    or "봇" in title
                    or (body_snippet and "봇 확인" in body_snippet)
                ):
                    site = "gmarket" if is_gmarket else "auction"
                    leave_open = True
                    print(f"    [{'G마켓' if is_gmarket else '옥션'}] 봇 확인 화면 감지 → 창 유지, 점검필요로 기록")
                    return _verification_result(site, f"봇 확인 화면 감지 (title={title!r})")

            _diag(url, "⑤가격추출(일반) 직전")
            name: Optional[str] = None
            og_title_el = await page.query_selector('meta[property="og:title"]')
            if og_title_el:
                og_title = await og_title_el.get_attribute("content")
                if og_title:
                    name = og_title.strip()
                    if is_gmarket:
                        for prefix in ("G마켓-", "G마켓 -"):
                            if name.startswith(prefix):
                                name = name[len(prefix):].strip()
                                break
                    if is_lotteon:
                        name = re.sub(r'^\[[^\]]+\]\s*', '', name)
                        if ' : 롯데ON' in name:
                            name = name[:name.index(' : 롯데ON')].strip()
                    if is_lgcom and ' | LG전자' in name:
                        name = name[:name.index(' | LG전자')].strip()

            body_text: Optional[str] = None
            try:
                body_text = await page.inner_text("body")
            except Exception:
                pass

            price: Optional[int] = None
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

            # 11번가: 기본가(productPrdInfo.finalDscPrc) + 쿠폰 공개 API 최대할인가.
            # 쿠폰이 있다고 나오는데 할인 계산이 실패하면 "미반영"으로 보고 재시도.
            if is_11st and price is None:
                async def _attempt_11st_price():
                    raw11 = await page.evaluate(
                        "() => (typeof productPrdInfo!=='undefined'&&productPrdInfo.finalDscPrc)||null")
                    if not isinstance(raw11, (int, float)):
                        return None, False
                    base_price = int(raw11)

                    cpn = await page.evaluate("""() => {
                        if (typeof productCouponDownInfo==='undefined') return null;
                        const {prdNo,selPrc,xsiteCode,wireCode,dscCupnIssNo,dscCupnCalcAmt,
                               dupCupnIssNo,dupCupnCalcAmt,downloadCupnCnt,dscCupnListCnt,
                               dupCupnListCnt} = productCouponDownInfo;
                        return {prdNo,selPrc,xsiteCode,wireCode,dscCupnIssNo,dscCupnCalcAmt,
                                dupCupnIssNo,dupCupnCalcAmt,downloadCupnCnt,dscCupnListCnt,
                                dupCupnListCnt};
                    }""")
                    disc = _fetch_11st_coupon_discount(cpn)
                    coupon_expected = bool(cpn and (cpn.get("downloadCupnCnt", 0) or cpn.get("dupCupnListCnt", 0)))
                    final_price = base_price
                    if disc and PRICE_MIN <= base_price - disc <= PRICE_MAX:
                        final_price = base_price - disc

                    is_stable = not (coupon_expected and disc is None)
                    return final_price, is_stable

                price = await retry_until_stable(_attempt_11st_price)

            if price is None:
                _od = await page.query_selector('meta[property="og:description"]')
                if _od:
                    _oc = await _od.get_attribute("content")
                    if _oc:
                        price = _extract_price(_oc)

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

            if price is None and body_text:
                price = _extract_price(body_text)

            buy_button_found = False
            buy_button_signal = "없음"
            for sel in [
                # LG닷컴: 모바일용/PC용 "구매하기" 버튼을 둘 다 DOM에 렌더링하고 CSS로만
                # 하나를 숨김. query_selector는 첫 매칭(모바일용, 숨김)만 보므로 뒤에 있는
                # 범용 'a:has-text("구매하기")'보다 먼저 PC 영역으로 스코프를 좁혀 확인
                '.btn-group.is-pc a:has-text("구매하기")',
                'button:has-text("구매하기")', 'button:has-text("바로구매")', 'a:has-text("구매하기")', 'em:has-text("구매하기")',
                "#buyNow", ".btnBuy", ".btn_buy", "#buyBtn", "#btn_buy",
                'a.btn.cart', '.item__button--cart',
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

            # LG닷컴 "일시품절" 배너: 버튼(.oneLineBtn.sold)이 DOM엔 있지만
            # 스탠드형/벽걸이형 등 변형 탭 구조 때문에 Playwright의 is_visible()이
            # False로 나와 위 셀렉터 루프가 못 잡음 → 본문 텍스트로 폴백 확인
            if is_lgcom and not sold_out_found and body_text and "일시품절" in body_text:
                sold_out_found = True
                sold_out_signal = "일시품절(본문 텍스트)"

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
            _diag(url, "⑤가격추출(일반) 직후")

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
            if not leave_open:
                if browser is not None:
                    _diag(url, "⑥browser.close() 직전 (일반 context)")
                    await browser.close()
                    _diag(url, "⑥browser.close() 직후 (일반 context)")
                else:
                    _diag(url, "⑥context.close() 직전 (persistent context: gmarket/auction/naver)")
                    await context.close()
                    _diag(url, "⑥context.close() 직후 (persistent context: gmarket/auction/naver)")

    finally:
        if leave_open:
            # 사람이 확인할 때까지 드라이버 연결을 끊지 않고 참조를 붙잡아 GC를 방지한다.
            _OPEN_REVIEW_SESSIONS.append(p)
        else:
            _diag(url, "⑦p.stop() 직전 (Playwright 드라이버 종료)")
            await p.stop()
            _diag(url, "⑦p.stop() 직후")
