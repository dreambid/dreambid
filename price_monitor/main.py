"""쇼핑몰 가격 모니터링 CLI 메인 진입점"""
import argparse
import asyncio
import os
import sys
import time
from pathlib import Path
from typing import Optional

import schedule
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from product_manager import (
    add_product,
    delete_product,
    list_products,
    load_products,
    update_product_state,
)
from scraper import (
    scrape_product,
    _is_gmarket,
    _is_auction,
    _is_naver,
    _diag,
    _OPEN_REVIEW_SESSIONS,
)
from telegram_bot import (
    notify_error,
    notify_manual_review,
    notify_out_of_stock,
    notify_price_change,
    notify_restock,
    notify_selector_check,
)


_WATCH_DIR = Path(__file__).parent

# 쇼핑몰 그룹별 동시 실행 수 제한 (봇 차단 회피 — 사이트 부하 특성에 맞춰 그룹 분리)
# 오늘의집(ohou)은 등록 자체가 차단되어 더 이상 이 분류에 실질적으로 걸리지 않는다.
# NOTE: asyncio.Semaphore/Lock은 Python 3.9에서 생성 시점의 이벤트 루프에 바인딩된다.
# 모듈 임포트 시점(asyncio.run() 호출 전)에 만들면 이후 asyncio.run()이 새로 만드는
# 루프와 불일치해 "attached to a different loop" 오류가 난다. 그래서 실제 사용 시점인
# check_products() 코루틴 안에서 매번 새로 생성한다 (아래 None은 타입 힌트 목적).
HEADLESS_SEM: Optional[asyncio.Semaphore] = None            # 11번가/롯데온/LG닷컴/하이마트/SSG + 미분류 URL
GMARKET_AUCTION_SEM: Optional[asyncio.Semaphore] = None      # G마켓/옥션 (persistent context 세션 공유)
NAVER_SEM: Optional[asyncio.Semaphore] = None                # 네이버 스마트스토어

# products.json 읽기→수정→쓰기 전체 구간 보호 (update_product_state 동시 호출 대비)
_PRODUCTS_LOCK: Optional[asyncio.Lock] = None


class _CodeChangeHandler(FileSystemEventHandler):
    """소스 .py 파일 수정 감지 → 현재 프로세스 교체 재시작 (os.execv)"""

    def on_modified(self, event):
        if event.is_directory or Path(event.src_path).suffix != ".py":
            return
        fname = Path(event.src_path).name
        print(f"\n[자동재시작] 코드 변경 감지: {fname}", flush=True)
        print("[자동재시작] 재시작합니다...\n", flush=True)
        sys.stdout.flush()
        os.execv(sys.executable, [sys.executable] + sys.argv)


def _start_code_watcher() -> None:
    """백그라운드 스레드에서 .py 파일 변경을 감시하기 시작"""
    observer = Observer()
    observer.schedule(_CodeChangeHandler(), str(_WATCH_DIR), recursive=False)
    observer.daemon = True
    observer.start()


def _semaphore_for(url: str) -> asyncio.Semaphore:
    """URL이 속한 쇼핑몰 그룹에 맞는 세마포어 반환 (scraper.py의 기존 판별 함수 재사용)"""
    if _is_naver(url):
        return NAVER_SEM
    if _is_gmarket(url) or _is_auction(url):
        return GMARKET_AUCTION_SEM
    return HEADLESS_SEM


async def _check_one_product(product: dict) -> None:
    """gather 데드락 추적용 얇은 래퍼. 내부에 return이 여러 곳(early return)이라
    매번 앞에 로그를 넣는 대신, finally 하나로 "진짜 함수를 빠져나가는 순간"을 잡는다."""
    url = product.get("url", "?")
    try:
        await _check_one_product_impl(product)
    finally:
        _diag(url, "⑧ _check_one_product 완전 종료 (return 직전/직후)")


async def _check_one_product_impl(product: dict) -> None:
    """상품 1개의 가격/상태를 확인하고 변동 시 알림. 실패 시 해당 상품만 manual_check로 기록."""
    product_id = product["id"]
    name = product["name"]
    url = product["url"]
    last_price = product.get("last_price")
    last_status = product.get("status", "unknown")
    category = product.get("category", "price_monitor")

    print(f"  확인 중: {name}")

    # 스크래퍼 호출 (쇼핑몰 그룹별 세마포어로 동시 실행 수 제한)
    # asyncio.wait_for로 상위 타임아웃을 걸어, scrape_product 내부(또는 그 아래
    # Playwright/브라우저 서브프로세스)가 원인 불명으로 응답 없이 멈추더라도
    # 세마포어 슬롯이 영구히 소비되지 않고 다음 상품으로 넘어가도록 강제한다.
    try:
        sem = _semaphore_for(url)
        async with sem:
            result = await asyncio.wait_for(scrape_product(url), timeout=45)
    except Exception as e:
        print(f"    [오류] {name}: {e}")
        async with _PRODUCTS_LOCK:
            update_product_state(product_id, None, "manual_check", unknown_count=0)
        notify_error(name, str(e), category)
        return

    # 스크래핑 실패 처리
    if not result.get("success"):
        error_msg = result.get("error", "알 수 없는 오류")
        print(f"    [오류] {name}: {error_msg}")
        async with _PRODUCTS_LOCK:
            update_product_state(product_id, None, "manual_check", unknown_count=0)
        notify_error(name, error_msg, category)
        return

    # 캡차/Cloudflare 체크/로그인 확인 등 사람이 봐야 하는 화면: 점검필요로 기록.
    # 브라우저 창은 scraper.py 쪽에서 닫지 않고 열어둔 채로 반환하므로, 여기서는
    # 세마포어(이미 async with sem: 블록을 빠져나오며 반납됨)와 상태 기록만 처리한다.
    if result.get("verification_needed"):
        site = result.get("verification_site", "?")
        hint = result.get("verification_hint", "")
        async with _PRODUCTS_LOCK:
            update_product_state(product_id, None, "점검필요", unknown_count=0)
        print(f"    [점검필요] {name}: {site} 확인 화면 감지({hint}) — 창을 열어뒀으니 직접 확인 필요")
        notify_manual_review(name, site, category)
        return

    # WAF 차단 도메인(쿠팡) 등: 수동확인으로 저장하고 종료
    if result.get("manual_check"):
        async with _PRODUCTS_LOCK:
            update_product_state(product_id, None, "manual_check", unknown_count=0)
        print(f"    [수동확인] {name}: 자동 스크래핑 불가 - 직접 확인 필요")
        return

    # 판매중단 감지: 저장 후 상태 변화 시 알림
    if result.get("discontinued"):
        async with _PRODUCTS_LOCK:
            update_product_state(product_id, None, "discontinued", unknown_count=0)
        if last_status != "discontinued":
            print(f"    [판매중단] {name}: '현재 판매중인 상품이 아닙니다' 감지")
            notify_out_of_stock(f"[판매중단] {name}", category)
        else:
            print(f"    [판매중단유지] {name}")
        return

    # 신호 미감지: 확인필요로 저장 (판매중 가정하지 않음)
    # unknown_count가 3에 도달하는 순간에만(4회차부터는 재알림 안 함) 셀렉터 점검 알림
    if result.get("uncertain"):
        new_unknown_count = product.get("unknown_count", 0) + 1
        async with _PRODUCTS_LOCK:
            update_product_state(
                product_id, result.get("price"), "unknown", result.get("name"),
                unknown_count=new_unknown_count,
            )
        print(f"    [확인필요] {name}: 구매/품절/판매중단 버튼 모두 미감지 — 직접 확인 권장 (연속 {new_unknown_count}회)")
        if new_unknown_count == 3:
            notify_selector_check(name, product.get("site", "?"), url)
        return

    current_price: Optional[int] = result.get("price")
    is_out = result.get("out_of_stock", False)
    current_status = "out_of_stock" if is_out else "in_stock"

    # 상품 상태 저장 (스크래퍼가 반환한 name이 있으면 함께 갱신, unknown 연속 기록은 리셋)
    async with _PRODUCTS_LOCK:
        update_product_state(product_id, current_price, current_status, result.get("name"), unknown_count=0)

    # 첫 실행(last_price=None, status=unknown)이면 알림 없이 현재값만 저장
    if last_price is None and last_status == "unknown":
        price_disp = f"{current_price:,}원" if current_price else "미확인"
        print(f"    [초기화] {name}: {price_disp} / {current_status}")
        return

    # ── 상태 변화에 따른 알림 분기 ────────────────────────────────
    if last_status == "out_of_stock" and current_status == "in_stock":
        # 품절 → 재입고
        price_disp = f"{current_price:,}원" if current_price else "미확인"
        print(f"    [재입고] {name}: {price_disp}")
        notify_restock(name, current_price, category)

    elif last_status != "out_of_stock" and current_status == "out_of_stock":
        # 판매중 → 품절
        print(f"    [품절] {name}")
        notify_out_of_stock(name)

    elif current_status == "in_stock" and current_price is not None and last_price is not None:
        # 가격 변동 감지 (재고 있는 경우에만)
        if current_price != last_price:
            print(f"    [가격변동] {name}: {last_price:,}원 → {current_price:,}원")
            notify_price_change(name, last_price, current_price, category)
        else:
            print(f"    [변동없음] {name}: {current_price:,}원")
    else:
        price_disp = f"{current_price:,}원" if current_price else "미확인"
        print(f"    [확인완료] {name}: {price_disp} / {current_status}")


async def check_products():
    """등록된 모든 상품의 가격 및 상태를 동시에 확인 (상품별 태스크 + gather)"""
    global HEADLESS_SEM, GMARKET_AUCTION_SEM, NAVER_SEM, _PRODUCTS_LOCK
    # 현재 실행 중인 이벤트 루프에 바인딩되도록 매 사이클 새로 생성
    HEADLESS_SEM = asyncio.Semaphore(4)
    GMARKET_AUCTION_SEM = asyncio.Semaphore(1)
    NAVER_SEM = asyncio.Semaphore(1)
    _PRODUCTS_LOCK = asyncio.Lock()

    products = load_products()
    if not products:
        print("[모니터링] 등록된 상품이 없습니다. 메뉴에서 상품을 추가하세요.")
        return

    print(f"\n[모니터링] {len(products)}개 상품 확인 시작...")

    tasks = [_check_one_product(product) for product in products]
    _diag("gather", f"asyncio.gather() 대기 시작... (leave_open 누적 세션 수={len(_OPEN_REVIEW_SESSIONS)})")
    results = await asyncio.gather(*tasks, return_exceptions=True)
    _diag("gather", f"asyncio.gather() 모든 태스크 완료 및 반환 성공! (leave_open 누적 세션 수={len(_OPEN_REVIEW_SESSIONS)})")

    # 태스크 내부 try/except를 뚫고 나온 미처리 예외만 별도 로그 (전체 배치는 계속 진행됨)
    for product, outcome in zip(products, results):
        if isinstance(outcome, Exception):
            print(f"    [미처리 오류] {product['name']}: {outcome}")

    print("[모니터링] 이번 회차 확인 완료\n")


def run_monitoring():
    """schedule을 이용해 매시 정각(1:00, 2:00, ...)에 반복 모니터링 실행"""
    print("\n[모니터링] 매시 정각에 실행합니다. Ctrl+C로 중지하세요.\n")

    # 시작 즉시 1회 실행 (상품별 동시 스크래핑을 위한 asyncio 진입점)
    asyncio.run(check_products())

    # 이후 매시 정각마다 반복 (schedule은 동기 콜백만 등록 가능하므로 asyncio.run으로 감쌈)
    schedule.every().hour.at(":00").do(lambda: asyncio.run(check_products()))

    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[종료] 모니터링이 중지되었습니다.")
    finally:
        # 다음 모니터링 실행 시 이전 스케줄이 남지 않도록 초기화
        schedule.clear()


def menu_add_product():
    """상품 추가 메뉴"""
    print("\n[등록 가능 쇼핑몰]")
    print("  ✅ 자동 스크래핑 : 11번가 · G마켓 · 옥션 · 롯데온 · LG닷컴 · 오늘의집 · 하이마트 · 네이버 스마트스토어")
    print("  ⚠️  수동확인     : 쿠팡 (봇 차단으로 자동 스크래핑 불가)")
    name = input("\n상품명 입력: ").strip()
    url = input("상품 URL 입력: ").strip()
    if name and url:
        add_product(name, url)
    else:
        print("[오류] 상품명과 URL을 모두 입력해주세요.")


def menu_delete_product():
    """상품 삭제 메뉴"""
    list_products()
    product_id = input("삭제할 상품 ID 입력: ").strip()
    if product_id:
        delete_product(product_id)
    else:
        print("[오류] 상품 ID를 입력해주세요.")


def main():
    _start_code_watcher()
    print("=" * 45)
    print("    쇼핑몰 가격 모니터링 프로그램 v1.0")
    print("=" * 45)

    while True:
        print("\n메뉴를 선택하세요:")
        print("  1. 모니터링 시작")
        print("  2. 상품 추가")
        print("  3. 상품 삭제")
        print("  4. 목록 보기")
        print("  5. 종료")

        choice = input("\n선택 (1-5): ").strip()

        if choice == "1":
            run_monitoring()
        elif choice == "2":
            menu_add_product()
        elif choice == "3":
            menu_delete_product()
        elif choice == "4":
            list_products()
        elif choice == "5":
            print("프로그램을 종료합니다.")
            break
        else:
            print("[오류] 1~5 사이의 숫자를 입력해주세요.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--auto", action="store_true",
                        help="메뉴 없이 모니터링 루프 즉시 시작 (launchd 전용)")
    args, _ = parser.parse_known_args()

    if args.auto:
        # launchd 관리 모드: 코드 감시자 없이 모니터링만 실행
        # watchdog의 os.execv()와 launchd KeepAlive가 동시에 재시작하면 꼬일 수 있어 비활성화
        print("[자동모드] launchd 관리 모드로 시작합니다 (코드 감시자 비활성).")
        run_monitoring()
    else:
        main()
