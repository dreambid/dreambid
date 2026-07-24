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

# category(가격모니터링/경쟁사)와 완전히 독립적인 별도 분류. 미지정 시 None.
VALID_BRAND_CATEGORIES = {
    "samsung_fridge", "samsung_washer", "samsung_tv", "samsung_etc",
    "lg_fridge", "lg_washer", "lg_tv", "lg_etc",
    "other_brand",
}

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


def add_product(
    name: str,
    url: str,
    category: str = "price_monitor",
    brand_category: Optional[str] = None,
) -> Optional[dict]:
    """새 상품 등록. 오늘의집(ohou.se/ozip.me)은 모니터링 대상에서 제외되어 등록 자체를 차단한다."""
    if _detect_site(url) == "ohou":
        print("[등록불가] 오늘의집은 모니터링에서 제외되었습니다.")
        return None
    if category not in VALID_CATEGORIES:
        category = "price_monitor"
    if brand_category is not None and brand_category not in VALID_BRAND_CATEGORIES:
        brand_category = None
    products = load_products()
    product = {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "url": url,
        "site": _detect_site(url),
        "category": category,
        "brand_category": brand_category,
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


def set_brand_category(product_id: str, brand_category: Optional[str]) -> bool:
    """상품의 brand_category만 업데이트 (가격/상태는 건드리지 않음).
    잘못된 값이면 False, 상품을 못 찾아도 False를 반환한다."""
    if brand_category is not None and brand_category not in VALID_BRAND_CATEGORIES:
        return False
    products = load_products()
    updated = False
    for p in products:
        if p["id"] == product_id:
            p["brand_category"] = brand_category
            updated = True
            break
    if updated:
        save_products(products)
    return updated


def update_product_state(
    product_id: str,
    price: Optional[int],
    status: str,
    name: Optional[str] = None,
    unknown_count: Optional[int] = None,
    ssg_block_count: Optional[int] = None,
    reset_pending: bool = False,
):
    """특정 상품의 가격과 상태를 업데이트 (가격 변동 감지를 위해 prev_price 보존).
    unknown_count가 주어지면 '확인필요(unknown)' 연속 횟수를, ssg_block_count가 주어지면
    SSG 차단 페이지 연속 감지 횟수를 함께 기록한다. reset_pending=True면 급변동 의심
    상태(pending_price/pending_count)를 명시적으로 초기화한다 — 다른 파라미터들은
    "None이면 안 건드림" 방식이라 pending_price를 실제로 None으로 되돌리는 데는
    쓸 수 없어 별도 플래그로 처리한다."""
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
            if ssg_block_count is not None:
                p["ssg_block_count"] = ssg_block_count
            if reset_pending:
                p["pending_price"] = None
                p["pending_count"] = 0
            updated = True
            break

    if updated:
        save_products(products)
    else:
        print(f"[경고] update_product_state: ID '{product_id}' 상품을 찾을 수 없습니다.")


def set_pending_price(product_id: str, pending_price: Optional[int], pending_count: int) -> bool:
    """가격 급변동 의심 상태(pending_price/pending_count)만 갱신 (가격/상태는 안 건드림).
    같은 값이 연속 2회 확인되기 전까지, 의심되는 값과 그 확인 횟수를 다음 사이클까지
    들고 있기 위한 용도."""
    products = load_products()
    updated = False
    for p in products:
        if p["id"] == product_id:
            p["pending_price"] = pending_price
            p["pending_count"] = pending_count
            updated = True
            break
    if updated:
        save_products(products)
    return updated
