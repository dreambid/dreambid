'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Store, ShoppingCart, Wallet,
  BarChart3, FileText, Settings, ChevronRight, Home, LogOut, Megaphone,
} from 'lucide-react';
import { clearAdminLoggedIn } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/sellers', label: '판매자 관리', icon: Store },
  { href: '/admin/consumers', label: '소비자 관리', icon: Users },
  { href: '/admin/bids', label: '입찰 관리', icon: ShoppingCart },
  { href: '/admin/settlements', label: '정산 관리', icon: Wallet },
  { href: '/admin/analytics', label: '통계/분석', icon: BarChart3 },
  { href: '/admin/content', label: '콘텐츠 관리', icon: FileText },
  { href: '/admin/ads', label: '광고 관리', icon: Megaphone },
  { href: '/admin/settings', label: '시스템 설정', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            DB
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">DreamBid</p>
            <p className="text-slate-400 text-xs mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
              isActive(href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {isActive(href) && <ChevronRight size={14} />}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Home size={18} className="flex-shrink-0" />
          대시보드
        </Link>
        <button
          onClick={() => { clearAdminLoggedIn(); router.push('/admin/login'); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          로그아웃
        </button>
        <p className="text-slate-600 text-xs text-center pt-1">DreamBid Admin v1.0</p>
      </div>
    </aside>
  );
}
