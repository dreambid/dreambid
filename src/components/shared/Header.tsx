'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getConsumerUser, clearConsumerUser } from '@/lib/auth';
import type { ConsumerUser } from '@/lib/auth';

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* 소비자 전용 헤더 — (consumer) 레이아웃 공통 */
export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<ConsumerUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(getConsumerUser());
    setMounted(true);
  }, []);

  function logout() {
    clearConsumerUser();
    setUser(null);
    setOpen(false);
    router.push('/custom');
  }

  const authLinks = [
    { href: '/basket', label: '🛒 장바구니' },
    { href: '/requests', label: '📋 내 요청' },
    { href: '/profile', label: '👤 내 정보' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/custom" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold text-blue-700">드림비드</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-4">
          {mounted && user ? (
            <>
              {authLinks.map((l) => (
                <Link key={l.label} href={l.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  {l.label}
                </Link>
              ))}
              <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/consumer/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                로그인
              </Link>
              <Link href="/consumer/login" className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                회원가입
              </Link>
            </>
          )}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="flex md:hidden items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴"
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 py-3 shadow-lg">
          {mounted && user ? (
            <div className="space-y-1">
              {authLinks.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  {l.label}
                </Link>
              ))}
              <button onClick={logout}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link href="/consumer/login" onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                로그인
              </Link>
              <Link href="/consumer/login" onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
                회원가입
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
