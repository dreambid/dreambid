"""쿠팡 Akamai WAF 봇 인증 브라우저 프로필 초기화 스크립트

headless=False로 브라우저를 열어 사용자가 직접 봇 확인을 통과하면
Chromium 프로필(browser_profile_coupang/)이 자동 저장된다.

⚠️ 쿠팡은 Akamai WAF를 사용하며 G마켓/옥션(Cloudflare)보다 강력하다.
   persistent context로도 차단될 수 있으며, 그 경우 수동확인으로 유지된다.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

PROFILE_DIR = Path(os.path.dirname(__file__)) / "browser_profile_coupang"

TARGET_URL = "https://www.coupang.com/vp/products/8645024940?vendorItemId=92095536887&itemId=25091815989&landingType=SDP"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


async def init_profile():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            str(PROFILE_DIR),
            headless=False,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            user_agent=USER_AGENT,
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        print(f"[접속중] {TARGET_URL[:80]}")
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=30000)

        print()
        print("=" * 60)
        print("  브라우저 창에서 봇 확인 절차를 직접 통과해주세요.")
        print("  상품 페이지가 정상으로 보이면 여기서 Enter를 누르세요.")
        print("  (차단이 풀리지 않으면 Ctrl+C로 종료하세요)")
        print("=" * 60)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, input, "")

        title = await page.title()
        current_url = page.url
        print(f"\n[현재 URL] {current_url[:80]}")
        print(f"[타이틀]   {title}")

        # Akamai 차단 페이지 감지
        blocked_signals = ["Robot Check", "Access Denied", "403", "blocked"]
        if any(s.lower() in title.lower() for s in blocked_signals):
            print("\n[결과] ❌ Akamai WAF 차단 — headless=False로도 우회 불가")
            print("       쿠팡은 수동확인 방식을 유지합니다.")
            await context.close()
            return

        await context.close()
        print(f"\n[저장완료] {PROFILE_DIR}")
        print("  이후 scraper.py에서 headless=False로 동일 프로필 재사용")


if __name__ == "__main__":
    asyncio.run(init_profile())
