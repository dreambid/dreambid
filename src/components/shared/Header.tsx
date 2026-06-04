import Link from 'next/link';

interface HeaderProps {
  role?: 'consumer' | 'seller' | 'admin';
  basketCount?: number;
}

/* 역할별 헤더 — consumer/seller/admin 구분 */
export function Header({ role, basketCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold text-blue-700">드림비드</span>
          {role && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {role === 'consumer' ? '소비자' : role === 'seller' ? '판매자' : '관리자'}
            </span>
          )}
        </Link>

        {/* 역할별 네비게이션 */}
        <nav className="flex items-center gap-3">
          {role === 'consumer' && (
            <>
              <Link href="/requests" className="text-sm text-gray-600 hover:text-blue-600">내 요청</Link>
              {/* 바구니 아이콘 + 배지 */}
              <Link href="/basket" className="relative text-sm text-gray-600 hover:text-blue-600">
                <span className="text-xl">🛒</span>
                {basketCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {basketCount}
                  </span>
                )}
              </Link>
              <Link href="/request/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                비딩 요청
              </Link>
            </>
          )}
          {role === 'seller' && (
            <>
              <Link href="/seller/requests" className="text-sm text-gray-600 hover:text-blue-600">요청 목록</Link>
              <Link href="/seller/bids" className="text-sm text-gray-600 hover:text-blue-600">내 비딩</Link>
              <Link href="/seller/profile" className="text-sm text-gray-600 hover:text-blue-600">내 정보</Link>
            </>
          )}
          {role === 'admin' && (
            <span className="text-sm font-medium text-gray-700">관리자 패널</span>
          )}
        </nav>
      </div>
    </header>
  );
}
