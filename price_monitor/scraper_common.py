"""여러 스크래퍼가 공통으로 쓰는 재시도 유틸리티."""
import asyncio
from typing import Awaitable, Callable, Tuple, TypeVar

T = TypeVar("T")

RETRY_DELAY_SECONDS = 2
MAX_RETRIES = 3  # 1차 시도 + 재시도 3회 = 총 4번


async def retry_until_stable(attempt: Callable[[], Awaitable[Tuple[T, bool]]]) -> T:
    """attempt()를 최대 (1 + MAX_RETRIES)번 호출한다.

    attempt()는 (값, 이 값이 충분히 안정적인지) 튜플을 반환해야 한다.
    - 안정적이면(True) 그 값을 즉시 반환하고 종료.
    - 불안정하면(False) RETRY_DELAY_SECONDS초 대기 후 다시 attempt()를 호출한다.
    - 끝까지(총 1+MAX_RETRIES번) 안정적인 값이 안 나오면, 마지막 시도의 값을 그대로 반환한다.
    """
    result: T = None
    for attempt_no in range(MAX_RETRIES + 1):
        result, is_stable = await attempt()
        if is_stable:
            return result
        if attempt_no < MAX_RETRIES:
            await asyncio.sleep(RETRY_DELAY_SECONDS)
    return result
