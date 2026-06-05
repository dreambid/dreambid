'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getConsumerUser, clearConsumerUser } from '@/lib/auth';
import type { ConsumerUser } from '@/lib/auth';

interface HeaderProps {
  role?: 'consumer' | 'seller' | 'admin';
  basketCount?: number;
}

/* 역할별 헤더 — consumer/seller/admin 구분 */
export function Header({ role, basketCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<ConsumerUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getConsumerUser());
    setMounted(true);
  }, []);

  function handleLogout() {
    clearConsumerUser();
    router.push('/');
  }

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

          {/* 인증 버튼 영역 (마운트 후 렌더링) */}
          {mounted && role === 'consumer' && (
            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-700 font-medium">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/consumer/login"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/consumer/login"
                    className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          )}

          {/* 소비자가 아닌 페이지에서도 로그인/회원가입 표시 */}
          {mounted && !role && (
            <div className="flex items-center gap-2">
              <Link href="/consumer/login" className="text-sm text-gray-600 hover:text-blue-600">로그인</Link>
              <Link
                href="/consumer/login"
                className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
              >
                회원가입
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
