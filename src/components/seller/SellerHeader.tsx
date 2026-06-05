'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: '대시보드', href: '/seller/dashboard' },
  { label: '비딩 요청', href: '/seller/requests' },
  { label: '내 비딩', href: '/seller/bids' },
  { label: '거래/정산', href: '/seller/orders' },
  { label: '프로필', href: '/seller/profile' },
];

export function SellerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/seller" className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <span className="font-bold text-green-700">DreamBid Family</span>
        </Link>
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            🏠 홈
          </Link>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            승인됨
          </span>
          <span className="text-sm font-medium text-gray-700">박판매 가전</span>
        </div>
      </div>
    </header>
  );
}
