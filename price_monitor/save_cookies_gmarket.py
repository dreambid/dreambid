"""G마켓 Cloudflare 봇 인증 브라우저 프로필 초기화 스크립트

headless=False로 브라우저를 열어 사용자가 직접 봇 확인을 통과하면
Chromium 프로필(browser_profile_gmarket/)이 자동 저장된다.

저장된 프로필은 scraper.py에서 headless=True로 재사용한다.
쿠키 이식 방식(cookies_gmarket.json)과 달리 TLS 핑거프린트가 동일하게 유지되어
Cloudflare 재차단을 방지한다.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_gmarket"

# 어떤 G마켓 상품이든 무관 — Cloudflare 통과 후 프로필이 저장됨
TARGET_URL = "https://item.gmarket.co.kr/Item?goodscode=2712291443"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


async def init_profile():
    async with async_playwright() as p:
        # launch_persistent_context: 프로필 디렉토리에 쿠키+세션+핑거프린트 상태 저장
        context = await p.chromium.launch_persistent_context(
            str(PROFILE_DIR),
            headless=False,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
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

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, input, "")

        title = await page.title()
        current_url = page.url
        print(f"\n[현재 URL] {current_url}")
        print(f"[타이틀]   {title}")

        if "Just a moment" in title or "봇" in title:
            print("\n[경고] 아직 봇 확인 페이지입니다. 브라우저에서 완료 후 재시도하세요.")
            await context.close()
            return

        # context.close()가 브라우저 프로세스 종료 + 프로필 자동 저장
        await context.close()

        cookies_count = len(list(PROFILE_DIR.glob("Cookies*")))
        print(f"\n[저장완료] {PROFILE_DIR}")
        print(f"  이후 scraper.py에서 headless=True로 동일 프로필 재사용")


if __name__ == "__main__":
    asyncio.run(init_profile())
