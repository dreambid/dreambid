# 쇼핑몰 가격 모니터링 프로그램

11번가(11st.co.kr) 상품의 가격 변동과 품절/재입고를 텔레그램으로 알려주는 모니터링 도구입니다.

## 설치 순서

```bash
# 1. price_monitor 폴더로 이동
cd price_monitor

# 2. 가상환경 생성
python3 -m venv venv

# 3. 가상환경 활성화
source venv/bin/activate

# 4. 패키지 설치
pip install -r requirements.txt

# 5. Playwright 브라우저 설치
playwright install chromium

# 6. config.json에 텔레그램 봇 토큰과 채팅 ID 입력
#    (아래 텔레그램 설정 섹션 참고)
vi config.json

# 7. 프로그램 실행
python main.py
```

## 텔레그램 설정

`config.json`을 열어 아래 값을 입력하세요:

```json
{
  "BOT_TOKEN": "1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "CHAT_ID": "123456789",
  "CHECK_INTERVAL_MINUTES": 30
}
```

| 항목 | 설명 |
|------|------|
| `BOT_TOKEN` | [@BotFather](https://t.me/BotFather)에서 발급받은 봇 토큰 |
| `CHAT_ID` | [@userinfobot](https://t.me/userinfobot)에서 확인한 채팅 ID |
| `CHECK_INTERVAL_MINUTES` | 가격 확인 주기 (분 단위, 기본값: 30) |

## 사용법

```
메뉴:
  1. 모니터링 시작   - 설정된 주기로 가격 자동 확인
  2. 상품 추가       - 모니터링할 11번가 상품 URL 등록
  3. 상품 삭제       - 등록된 상품 제거
  4. 목록 보기       - 등록 상품과 현재 가격/상태 확인
  5. 종료
```

- 모니터링 시작 시 즉시 1회 실행 후, 설정된 주기로 반복합니다.
- **Ctrl+C**를 누르면 모니터링을 중지하고 메인 메뉴로 돌아갑니다.
- 첫 번째 실행에서는 현재 가격을 저장만 하고 알림을 보내지 않습니다.

## 알림 종류

| 알림 | 조건 |
|------|------|
| 💰 가격 변동 | 이전 가격과 현재 가격이 다를 때 |
| 🚫 품절 | 판매 중이던 상품이 품절되었을 때 |
| ✅ 재입고 | 품절이었던 상품이 다시 판매될 때 |
| ⚠️ 오류 | 스크래핑 중 오류가 발생했을 때 |

## 파일 구조

```
price_monitor/
├── main.py            # 메인 실행 파일 (CLI 메뉴)
├── scraper.py         # Playwright 기반 상품 정보 추출
├── product_manager.py # 상품 목록 관리 (CRUD)
├── telegram_bot.py    # 텔레그램 알림 전송
├── config.json        # 봇 설정 (토큰, 채팅 ID, 주기)
├── products.json      # 등록된 상품 목록 (자동 생성/관리)
├── requirements.txt   # Python 패키지 의존성
└── README.md          # 이 파일
```

## 시스템 요구사항

- macOS (Apple Silicon / Intel 모두 지원)
- Python 3.10 이상
- 인터넷 연결

## 주의사항

- 상품 URL은 11번가(11st.co.kr) 상품 페이지 URL을 입력하세요.
- 너무 짧은 주기로 설정하면 IP 차단이 발생할 수 있습니다. 30분 이상 권장합니다.
- 텔레그램 설정이 없어도 프로그램은 정상 동작하며, 알림만 전송되지 않습니다.
