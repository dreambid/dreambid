"""쇼핑몰 가격 모니터링 CLI 메인 진입점"""
import asyncio
import time
from typing import Optional

import schedule

from product_manager import (
    add_product,
    delete_product,
    list_products,
    load_products,
    update_product_state,
)
from scraper import scrape_product
from telegram_bot import (
    notify_error,
    notify_out_of_stock,
    notify_price_change,
    notify_restock,
)


def check_products():
    """등록된 모든 상품의 가격 및 상태를 한 번 확인"""
    products = load_products()
    if not products:
        print("[모니터링] 등록된 상품이 없습니다. 메뉴에서 상품을 추가하세요.")
        return

    print(f"\n[모니터링] {len(products)}개 상품 확인 시작...")

    for product in products:
        product_id = product["id"]
        name = product["name"]
        url = product["url"]
        last_price = product.get("last_price")
        last_status = product.get("status", "unknown")

        print(f"  확인 중: {name}")

        # 스크래퍼 호출 (비동기를 동기 컨텍스트에서 실행)
        try:
            result = asyncio.run(scrape_product(url))
        except Exception as e:
            print(f"    [오류] {name}: {e}")
            notify_error(name, str(e))
            time.sleep(2)
            continue

        # 스크래핑 실패 처리
        if not result.get("success"):
            error_msg = result.get("error", "알 수 없는 오류")
            print(f"    [오류] {name}: {error_msg}")
            notify_error(name, error_msg)
            time.sleep(2)
            continue

        # 쿠팡: Akamai WAF 차단으로 자동 스크래핑 불가 - 수동확인으로 저장하고 다음 상품으로
        if result.get("manual_check"):
            update_product_state(product_id, None, "manual_check")
            print(f"    [수동확인] {name}: 쿠팡은 자동 스크래핑이 차단되어 수동 확인이 필요합니다.")
            time.sleep(2)
            continue

        current_price: Optional[int] = result.get("price")
        is_out = result.get("out_of_stock", False)
        current_status = "out_of_stock" if is_out else "in_stock"

        # 상품 상태 저장
        update_product_state(product_id, current_price, current_status)

        # 첫 실행(last_price=None, status=unknown)이면 알림 없이 현재값만 저장
        if last_price is None and last_status == "unknown":
            price_disp = f"{current_price:,}원" if current_price else "미확인"
            print(f"    [초기화] {name}: {price_disp} / {current_status}")
            time.sleep(2)
            continue

        # ── 상태 변화에 따른 알림 분기 ────────────────────────────────
        if last_status == "out_of_stock" and current_status == "in_stock":
            # 품절 → 재입고
            price_disp = f"{current_price:,}원" if current_price else "미확인"
            print(f"    [재입고] {name}: {price_disp}")
            notify_restock(name, current_price)

        elif last_status != "out_of_stock" and current_status == "out_of_stock":
            # 판매중 → 품절
            print(f"    [품절] {name}")
            notify_out_of_stock(name)

        elif current_status == "in_stock" and current_price is not None and last_price is not None:
            # 가격 변동 감지 (재고 있는 경우에만)
            if current_price != last_price:
                print(f"    [가격변동] {name}: {last_price:,}원 → {current_price:,}원")
                notify_price_change(name, last_price, current_price)
            else:
                print(f"    [변동없음] {name}: {current_price:,}원")
        else:
            price_disp = f"{current_price:,}원" if current_price else "미확인"
            print(f"    [확인완료] {name}: {price_disp} / {current_status}")

        # 상품 간 2초 딜레이 (서버 부하 방지)
        time.sleep(2)

    print("[모니터링] 이번 회차 확인 완료\n")


def run_monitoring():
    """schedule을 이용해 매시 정각(1:00, 2:00, ...)에 반복 모니터링 실행"""
    print("\n[모니터링] 매시 정각에 실행합니다. Ctrl+C로 중지하세요.\n")

    # 시작 즉시 1회 실행
    check_products()

    # 이후 매시 정각마다 반복
    schedule.every().hour.at(":00").do(check_products)

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
    name = input("상품명 입력: ").strip()
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
    main()
