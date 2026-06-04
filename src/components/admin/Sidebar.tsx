'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { label: '대시보드', href: '/admin', icon: '📊' },
  { label: '사용자 관리', href: '/admin/users', icon: '👥' },
  { label: '경매 관리', href: '/admin/auctions', icon: '🔨' },
  { label: '설정', href: '/admin/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-gray-900">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="text-xl">🐟</span>
        <span className="font-bold text-white">{APP_NAME}</span>
        <span className="text-xs text-gray-400">관리자</span>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
