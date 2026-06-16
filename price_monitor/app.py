"""Flask REST API 서버 - 쇼핑몰 가격 모니터링 웹 인터페이스"""
import asyncio
from urllib.parse import urlparse

from flask import Flask, jsonify, request
from flask_cors import CORS

from product_manager import (
    add_product,
    delete_product,
    load_products,
    update_product_state,
)
from scraper import scrape_product

app = Flask(__name__)

# GitHub Pages 등 외부 도메인에서 접근할 수 있도록 CORS 전체 허용
CORS(app)


def _format_status(product: dict) -> str:
    """상품 상태를 UI 표시용 문자열로 변환"""
    status = product.get("status", "unknown")
    last_price = product.get("last_price")
    prev_price = product.get("prev_price")

    # 쿠팡: Akamai WAF 차단으로 자동 스크래핑 불가 - 수동확인 대상
    if status == "manual_check":
        return "쿠팡 (수동확인)"

    # 아직 수집 전
    if status == "unknown" or last_price is None:
        return "확인중"

    # 품절
    if status == "out_of_stock":
        return "품절"

    # 판매중: 이전 가격과 비교해 변동 표시
    price_str = f"{last_price:,}원"

    if prev_price is None or prev_price == last_price:
        return f"{price_str} · 변동없음"

    diff = abs(last_price - prev_price)
    if last_price < prev_price:
        return f"{price_str} · ▼{diff:,}원"
    else:
        return f"{price_str} · ▲{diff:,}원"


@app.route("/api/products", methods=["GET"])
def get_products():
    """전체 상품 목록 + 현재 가격 + 상태 반환"""
    products = load_products()
    result = [
        {
            "id": p["id"],
            "name": p["name"],
            "url": p["url"],
            "status_display": _format_status(p),
            "last_price": p.get("last_price"),
            "prev_price": p.get("prev_price"),
            "status": p.get("status", "unknown"),
            "added_at": p.get("added_at"),
            "last_checked": p.get("last_checked"),
        }
        for p in products
    ]
    return jsonify(result)


@app.route("/api/products", methods=["POST"])
def post_product():
    """상품 추가 (url 필수) - 추가 즉시 스크래핑해서 상품명/가격/상태까지 저장"""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "요청 본문이 없습니다."}), 400

    url = (data.get("url") or "").strip()
    name = (data.get("name") or "").strip()

    if not url:
        return jsonify({"error": "url 필드가 필요합니다."}), 400

    # 추가 즉시 스크래핑 실행 (상품명, 가격, 재고 상태를 한 번에 수집)
    try:
        scrape_result = asyncio.run(scrape_product(url))
    except Exception as e:
        scrape_result = {"success": False, "error": str(e)}

    if not name:
        if scrape_result.get("success") and scrape_result.get("name"):
            name = scrape_result["name"]
        else:
            # 추출 실패 시 도메인명을 임시 상품명으로 사용
            name = urlparse(url).netloc

    product = add_product(name, url)

    # 스크래핑 성공 시 가격/상태 즉시 저장 후 최신 상태 다시 로드
    if scrape_result.get("success"):
        if scrape_result.get("manual_check"):
            update_product_state(product["id"], None, "manual_check")
        else:
            price = scrape_result.get("price")
            status = "out_of_stock" if scrape_result.get("out_of_stock") else "in_stock"
            update_product_state(product["id"], price, status)
        product = next(p for p in load_products() if p["id"] == product["id"])

    product["status_display"] = _format_status(product)
    return jsonify(product), 201


@app.route("/api/products/<product_id>", methods=["DELETE"])
def remove_product(product_id):
    """상품 삭제"""
    success = delete_product(product_id)
    if not success:
        return jsonify({"error": f"ID '{product_id}'를 찾을 수 없습니다."}), 404
    return jsonify({"message": f"ID '{product_id}' 상품이 삭제되었습니다."}), 200


if __name__ == "__main__":
    # 0.0.0.0으로 바인딩해 로컬 네트워크에서도 접근 가능
    app.run(host="0.0.0.0", port=5001, debug=False)
