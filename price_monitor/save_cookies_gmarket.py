"""G마켓 Cloudflare 봇 인증 쿠키 저장 스크립트

headless=False로 브라우저를 열어 사용자가 직접 봇 확인을 통과한 뒤
쿠키와 localStorage를 cookies_gmarket.json으로 저장한다.

저장된 파일은 scraper.py에서 불러와 인증된 세션으로 재사용한다.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright

COOKIES_PATH = os.path.join(os.path.dirname(__file__), "cookies_gmarket.json")

# 쿠키 저장 테스트용 기준 상품 URL (어떤 G마켓 상품이든 무관)
TARGET_URL = "https://item.gmarket.co.kr/Item?goodscode=2712291443"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


async def save_cookies():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        print(f"[접속중] {TARGET_URL}")
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=30000)

        print()
        print("=" * 60)
        print("  브라우저 창에서 봇 확인 절차를 직접 통과해주세요.")
        print("  상품 페이지가 정상으로 보이면 여기서 Enter를 누르세요.")
        print("=" * 60)

        # 사용자가 봇 인증을 마칠 때까지 대기 (비동기 차단 방지)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, input, "")

        # 현재 상태 확인
        current_url = page.url
        title = await page.title()
        print(f"\n[현재 URL] {current_url}")
        print(f"[타이틀]   {title}")

        # Cloudflare 차단 페이지 여부 경고
        if "Just a moment" in title or "봇" in title:
            print("\n[경고] 아직 봇 확인 페이지인 것 같습니다.")
            print("       브라우저에서 확인을 완료한 뒤 다시 시도하세요.")
            await browser.close()
            return

        # storage_state = 쿠키 + localStorage 전체 (cf_clearance 포함)
        storage = await context.storage_state()
        cookies = storage.get("cookies", [])

        with open(COOKIES_PATH, "w", encoding="utf-8") as f:
            json.dump(storage, f, ensure_ascii=False, indent=2)

        # 저장된 Cloudflare 관련 쿠키 요약 출력
        cf_cookies = [c for c in cookies if "cf_" in c.get("name", "")]
        print(f"\n[저장완료] {COOKIES_PATH}")
        print(f"  전체 쿠키: {len(cookies)}개")
        print(f"  Cloudflare 쿠키: {len(cf_cookies)}개 "
              f"({', '.join(c['name'] for c in cf_cookies) or '없음'})")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(save_cookies())
