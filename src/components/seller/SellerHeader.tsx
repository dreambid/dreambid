'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSellerUser, clearSellerUser } from '@/lib/auth';
import type { SellerUser } from '@/lib/auth';

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

const midNav = [
  { label: '비딩 요청', href: '/seller/requests' },
  { label: '내 비딩', href: '/seller/bids' },
  { label: '거래/정산', href: '/seller/orders' },
];

const authLinks = [
  { href: '/seller/dashboard', label: '📊 대시보드' },
  { href: '/seller/bids', label: '🔔 새 알림' },
  { href: '/seller/profile', label: '👤 내 정보' },
];

const guestLinks = [
  { href: '/seller/login', label: '로그인' },
  { href: '/seller/register', label: '가입 신청', primary: true },
];

export function SellerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeller(getSellerUser());
    setMounted(true);
  }, []);

  function logout() {
    clearSellerUser();
    setSeller(null);
    setOpen(false);
    router.push('/seller');
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* 로고 */}
        <Link href="/seller" className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <span className="font-bold text-green-700">DreamBid Family</span>
        </Link>

        {/* 데스크탑 중간 nav (로그인 시만 표시) */}
        {mounted && seller && (
          <nav className="hidden md:flex gap-1">
            {midNav.map((item) => (
              <Link key={item.href} href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* 데스크탑 오른쪽 */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && seller ? (
            <>
              {authLinks.map((l) => (
                <Link key={l.label} href={l.href}
                  className="text-sm text-gray-600 hover:text-green-700 transition-colors">
                  {l.label}
                </Link>
              ))}
              <button onClick={logout}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                🏠 홈
              </Link>
              <div className="h-5 w-px bg-gray-200" />
              {guestLinks.map((l) => (
                l.primary
                  ? <Link key={l.label} href={l.href}
                      className="rounded-lg border border-green-600 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">
                      {l.label}
                    </Link>
                  : <Link key={l.label} href={l.href}
                      className="text-sm text-gray-600 hover:text-green-700 transition-colors">
                      {l.label}
                    </Link>
              ))}
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
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
          {mounted && seller ? (
            <div className="space-y-1">
              {[...authLinks, ...midNav.map((m) => ({ href: m.href, label: m.label }))].map((l) => (
                <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)}
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
              <Link href="/" onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50">
                🏠 홈
              </Link>
              <div className="my-1 border-t border-gray-100" />
              {guestLinks.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 ${l.primary ? 'font-medium text-green-600' : 'text-gray-700'}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
