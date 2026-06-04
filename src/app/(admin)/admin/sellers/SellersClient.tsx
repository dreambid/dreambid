'use client';

import { useState } from 'react';
import type { Seller } from '@/types/seller';
import { formatDate, formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Search, Star } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'suspended';

const BRAND_LABELS: Record<string, string> = {
  samsung: '삼성', lg: 'LG', carrier: '캐리어',
};
const CATEGORY_LABELS: Record<string, string> = {
  tv: 'TV', refrigerator: '냉장고', 'air-conditioner': '에어컨',
  'washing-machine': '세탁기', 'clothing-care': '의류관리기',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '승인 대기', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: '승인됨', cls: 'bg-green-100 text-green-700' },
    suspended: { label: '정지됨', cls: 'bg-red-100 text-red-700' },
    withdrawn: { label: '탈퇴', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', cls)}>{label}</span>;
}

export default function SellersClient({ sellers: initial }: { sellers: Seller[] }) {
  const [sellers, setSellers] = useState(initial);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = sellers.filter((s) => {
    const matchStatus = filter === 'all' || s.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.companyName.includes(q) || s.ceoName.includes(q) || s.bizNumber.includes(q);
    return matchStatus && matchSearch;
  });

  const updateStatus = async (id: string, status: string) => {
    setLoading(true);
    const body: Record<string, string> = { status };
    if (status === 'approved') body.approvedAt = new Date().toISOString();
    const res = await fetch(`/api/sellers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const updated: Seller = await res.json();
      setSellers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSelected(null);
    }
    setLoading(false);
  };

  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: `대기 (${sellers.filter((s) => s.status === 'pending').length})` },
    { value: 'approved', label: '승인됨' },
    { value: 'suspended', label: '정지됨' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-md transition-colors', filter === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업체명, 대표명, 사업자번호"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500">
              <th className="text-left px-4 py-3 font-medium">업체 정보</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-right px-4 py-3 font-medium">총 입찰</th>
              <th className="text-right px-4 py-3 font-medium">매출</th>
              <th className="text-center px-4 py-3 font-medium">평점</th>
              <th className="text-center px-4 py-3 font-medium">상태</th>
              <th className="text-center px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900">{s.companyName}</p>
                  <p className="text-xs text-gray-400">{s.ceoName} · {s.bizNumber}</p>
                  <p className="text-xs text-gray-400">{s.address}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {s.productCategories.slice(0, 2).map((c) => (
                      <span key={c} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[c] ?? c}
                      </span>
                    ))}
                    {s.productCategories.length > 2 && (
                      <span className="text-xs text-gray-400">+{s.productCategories.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700">{s.totalBids}건</td>
                <td className="px-4 py-3.5 text-right text-gray-700">{formatPrice(s.totalRevenue)}</td>
                <td className="px-4 py-3.5 text-center">
                  {s.rating > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-amber-500">
                      <Star size={13} fill="currentColor" />
                      <span className="text-xs font-medium text-gray-700">{s.rating.toFixed(1)}</span>
                    </span>
                  ) : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3.5 text-center"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => setSelected(s)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">조회된 판매자가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">판매자 상세 — {selected.companyName}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  ['대표자', selected.ceoName],
                  ['사업자번호', selected.bizNumber],
                  ['담당자', selected.managerName],
                  ['연락처', selected.managerPhone],
                  ['이메일', selected.email],
                  ['주소', selected.address],
                  ['은행', `${selected.bankName} ${selected.accountNumber}`],
                  ['예금주', selected.accountHolder],
                  ['가입일', formatDate(selected.createdAt)],
                  ['경고 횟수', `${selected.warningCount}회`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-gray-800 font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">취급 브랜드</p>
                <p className="text-gray-800">{selected.brands.map((b) => BRAND_LABELS[b] ?? b).join(', ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">취급 카테고리</p>
                <p className="text-gray-800">{selected.productCategories.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              {selected.status === 'pending' && (
                <>
                  <button
                    disabled={loading}
                    onClick={() => updateStatus(selected.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    <CheckCircle size={15} /> 승인
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => updateStatus(selected.id, 'suspended')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    <XCircle size={15} /> 반려
                  </button>
                </>
              )}
              {selected.status === 'approved' && (
                <button
                  disabled={loading}
                  onClick={() => updateStatus(selected.id, 'suspended')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  <AlertTriangle size={15} /> 정지
                </button>
              )}
              {selected.status === 'suspended' && (
                <button
                  disabled={loading}
                  onClick={() => updateStatus(selected.id, 'approved')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  <CheckCircle size={15} /> 정지 해제
                </button>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
