"""텔레그램 봇을 통한 알림 전송 모듈"""
import json
import os
import requests

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

# 설정값이 기본값인지 확인하기 위한 플레이스홀더
_PLACEHOLDER_TOKEN = "여기에_봇_토큰_입력"
_PLACEHOLDER_CHAT_ID = "여기에_채팅ID_입력"


def _load_config() -> dict:
    """config.json에서 설정 읽기"""
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def send_message(message: str) -> bool:
    """텔레그램으로 메시지 전송. 토큰 미설정 시 경고만 출력하고 False 반환.
    재활성화: config.json의 NOTIFICATIONS_ENABLED 를 true 로 변경.
    """
    try:
        config = _load_config()

        # 알림 일시 중지 플래그 (기본값 True — 키 없으면 활성 상태로 동작)
        if not config.get("NOTIFICATIONS_ENABLED", True):
            print("[알림 중지] NOTIFICATIONS_ENABLED=false — 전송 건너뜀")
            return False

        token = config.get("BOT_TOKEN", "")
        chat_id = config.get("CHAT_ID", "")

        # 토큰 미설정 확인
        if not token or token == _PLACEHOLDER_TOKEN:
            print("[경고] 텔레그램 BOT_TOKEN이 설정되지 않았습니다. config.json을 확인하세요.")
            return False
        if not chat_id or chat_id == _PLACEHOLDER_CHAT_ID:
            print("[경고] 텔레그램 CHAT_ID가 설정되지 않았습니다. config.json을 확인하세요.")
            return False

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return True
        else:
            print(f"[텔레그램 오류] HTTP {response.status_code}: {response.text}")
            return False

    except FileNotFoundError:
        print("[경고] config.json 파일을 찾을 수 없습니다.")
        return False
    except Exception as e:
        print(f"[텔레그램 오류] 메시지 전송 실패: {e}")
        return False


def notify_price_change(name: str, old_price: int, new_price: int):
    """가격 변동 알림 전송"""
    direction = "▼ 하락" if new_price < old_price else "▲ 상승"
    diff = abs(new_price - old_price)
    message = (
        f"💰 <b>가격 변동 알림</b>\n"
        f"상품: {name}\n"
        f"변동: {direction}\n"
        f"이전 가격: {old_price:,}원\n"
        f"현재 가격: {new_price:,}원\n"
        f"차이: {diff:,}원"
    )
    send_message(message)


def notify_out_of_stock(name: str):
    """품절 알림 전송"""
    message = (
        f"🚫 <b>품절 알림</b>\n"
        f"상품: {name}\n"
        f"해당 상품이 품절되었습니다."
    )
    send_message(message)


def notify_restock(name: str, current_price: int):
    """재입고 알림 전송"""
    price_str = f"{current_price:,}원" if current_price is not None else "가격 미확인"
    message = (
        f"✅ <b>재입고 알림</b>\n"
        f"상품: {name}\n"
        f"현재 가격: {price_str}\n"
        f"재입고되었습니다!"
    )
    send_message(message)


def notify_no_change(count: int):
    """변동없음 요약 알림 전송"""
    message = f"✅ 관리상품 {count}개 상태 변동사항 없습니다"
    send_message(message)


def notify_error(name: str, error_msg: str):
    """오류 알림 전송"""
    message = (
        f"⚠️ <b>오류 알림</b>\n"
        f"상품: {name}\n"
        f"오류 내용: {error_msg}"
    )
    send_message(message)
