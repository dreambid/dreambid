'use client';

import { useState } from 'react';
import type { Consumer } from '@/types/user';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Search, UserX, UserCheck } from 'lucide-react';

const PROVIDER_LABELS: Record<string, string> = {
  kakao: '카카오', naver: '네이버', google: '구글', apple: '애플',
};
const PROVIDER_COLORS: Record<string, string> = {
  kakao: 'bg-yellow-100 text-yellow-700',
  naver: 'bg-green-100 text-green-700',
  google: 'bg-blue-100 text-blue-700',
  apple: 'bg-gray-100 text-gray-700',
};

export default function ConsumersClient({ consumers: initial }: { consumers: Consumer[] }) {
  const [consumers, setConsumers] = useState(initial);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState('');

  const filtered = consumers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.includes(q) || c.email.includes(q) || (c.phone ?? '').includes(q);
  });

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    setLoading(id);
    const res = await fetch(`/api/consumers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated: Consumer = await res.json();
      setConsumers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    setLoading('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 전화번호"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500 ml-auto">{filtered.length}명</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500">
              <th className="text-left px-4 py-3 font-medium">소비자 정보</th>
              <th className="text-left px-4 py-3 font-medium">가입 방법</th>
              <th className="text-right px-4 py-3 font-medium">총 요청</th>
              <th className="text-right px-4 py-3 font-medium">완료 거래</th>
              <th className="text-left px-4 py-3 font-medium">가입일</th>
              <th className="text-center px-4 py-3 font-medium">상태</th>
              <th className="text-center px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                  {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', PROVIDER_COLORS[c.provider])}>
                    {PROVIDER_LABELS[c.provider]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700">{c.totalRequests}건</td>
                <td className="px-4 py-3.5 text-right text-gray-700">{c.completedDeals}건</td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {c.status === 'active' ? '정상' : '정지'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    disabled={loading === c.id}
                    onClick={() => toggleStatus(c.id, c.status)}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                      c.status === 'active'
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-green-600 bg-green-50 hover:bg-green-100'
                    )}
                  >
                    {c.status === 'active' ? <><UserX size={13} /> 정지</> : <><UserCheck size={13} /> 해제</>}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">소비자가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
