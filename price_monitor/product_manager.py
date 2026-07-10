"""상품 목록 관리 모듈 (추가/삭제/조회/상태 업데이트)"""
import json
import os
import uuid
from datetime import datetime
from typing import Optional

PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "products.json")


def load_products() -> list[dict]:
    """products.json에서 상품 목록 불러오기"""
    try:
        with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("products", [])
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        print("[오류] products.json 파싱 실패. 빈 목록으로 초기화합니다.")
        return []


def save_products(products: list[dict]):
    """상품 목록을 products.json에 저장"""
    with open(PRODUCTS_PATH, "w", encoding="utf-8") as f:
        json.dump({"products": products}, f, ensure_ascii=False, indent=2)


VALID_CATEGORIES = {"price_monitor", "competitor"}

_SITE_MAP = [
    ("smartstore.naver.com", "naver"),
    ("11st.co.kr",           "11st"),
    ("gmarket.co.kr",        "gmarket"),
    ("auction.co.kr",        "auction"),
    ("lotteon.com",          "lotteon"),
    ("lge.co.kr",            "lgcom"),
    ("ohou.se",              "ohou"),
    ("ozip.me",              "ohou"),
    ("e-himart.co.kr",       "himart"),
    ("ssg.com",              "ssg"),
    ("coupang.com",          "coupang"),
]


def _detect_site(url: str) -> str:
    url_lower = url.lower()
    for domain, site in _SITE_MAP:
        if domain in url_lower:
            return site
    return "unknown"


def add_product(name: str, url: str, category: str = "price_monitor") -> Optional[dict]:
    """새 상품 등록. 오늘의집(ohou.se/ozip.me)은 모니터링 대상에서 제외되어 등록 자체를 차단한다."""
    if _detect_site(url) == "ohou":
        print("[등록불가] 오늘의집은 모니터링에서 제외되었습니다.")
        return None
    if category not in VALID_CATEGORIES:
        category = "price_monitor"
    products = load_products()
    product = {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "url": url,
        "site": _detect_site(url),
        "category": category,
        "last_price": None,
        "status": "unknown",
        "added_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "last_checked": None,
    }
    products.append(product)
    save_products(products)
    print(f"[추가완료] '{name}' 상품이 등록되었습니다. (ID: {product['id']})")
    return product


def delete_product(product_id: str) -> bool:
    """ID로 상품 삭제"""
    products = load_products()
    original_count = len(products)
    products = [p for p in products if p["id"] != product_id]

    if len(products) == original_count:
        print(f"[오류] ID '{product_id}'에 해당하는 상품을 찾을 수 없습니다.")
        return False

    save_products(products)
    print(f"[삭제완료] ID '{product_id}' 상품이 삭제되었습니다.")
    return True


def list_products():
    """등록된 상품 목록을 가격/상태와 함께 출력"""
    products = load_products()
    if not products:
        print("등록된 상품이 없습니다.")
        return

    print("\n" + "=" * 65)
    print(f"{'ID':^8}  {'상품명':^25}  {'가격':^12}  {'상태':^8}")
    print("-" * 65)
    for p in products:
        # 가격 표시
        if p.get("last_price") is not None:
            price_str = f"{p['last_price']:,}원"
        else:
            price_str = "미확인"

        # 상태 한글 변환
        status_map = {
            "in_stock": "판매중",
            "out_of_stock": "품절",
            "unknown": "미확인",
            "manual_check": "수동확인",
            "discontinued": "판매중단",
            "점검필요": "점검필요",
        }
        status_str = status_map.get(p.get("status", "unknown"), "미확인")

        # 상품명 30자 초과 시 말줄임
        name_display = p["name"][:23] + "…" if len(p["name"]) > 24 else p["name"]
        print(f"{p['id']:^8}  {name_display:<25}  {price_str:>12}  {status_str:^8}")
    print("=" * 65 + "\n")


def update_product_state(
    product_id: str,
    price: Optional[int],
    status: str,
    name: Optional[str] = None,
    unknown_count: Optional[int] = None,
):
    """특정 상품의 가격과 상태를 업데이트 (가격 변동 감지를 위해 prev_price 보존).
    unknown_count가 주어지면 '확인필요(unknown)' 연속 횟수를 함께 기록한다."""
    products = load_products()
    updated = False
    for p in products:
        if p["id"] == product_id:
            # 이전 가격 보존 (가격 변동 표시에 사용)
            p["prev_price"] = p.get("last_price")
            p["last_price"] = price
            p["status"] = status
            p["last_checked"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if name:
                p["name"] = name
            if unknown_count is not None:
                p["unknown_count"] = unknown_count
            updated = True
            break

    if updated:
        save_products(products)
    else:
        print(f"[경고] update_product_state: ID '{product_id}' 상품을 찾을 수 없습니다.")
