'use client';

import { useState } from 'react';
import type { BidRequest } from '@/types/bidRequest';
import type { Bid } from '@/types';
import { formatPrice, formatDateTime, getBidRequestStatusLabel, getBidRequestStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface BidRequestWithBids extends BidRequest {
  bids: Bid[];
}

function BidStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    selected: 'bg-purple-100 text-purple-700',
    failed: 'bg-gray-100 text-gray-500',
    withdrawn: 'bg-red-100 text-red-600',
  };
  const labels: Record<string, string> = {
    pending: '검토중', selected: '낙찰', failed: '미선택', withdrawn: '철회',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', map[status] ?? 'bg-gray-100 text-gray-500')}>
      {labels[status] ?? status}
    </span>
  );
}

export default function BidsClient({ data }: { data: BidRequestWithBids[] }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.categoryName.includes(q) || r.id.includes(q);
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="요청 ID, 카테고리"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500 ml-auto">{filtered.length}건</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500">
              <th className="w-8" />
              <th className="text-left px-4 py-3 font-medium">요청 ID</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-right px-4 py-3 font-medium">입찰 수</th>
              <th className="text-left px-4 py-3 font-medium">생성일</th>
              <th className="text-left px-4 py-3 font-medium">만료일</th>
              <th className="text-center px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <>
                <tr
                  key={r.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggle(r.id)}
                >
                  <td className="pl-4 py-3.5 text-gray-400">
                    {expanded.has(r.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{r.id}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{r.categoryName}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{r.bidCount}건</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDateTime(r.expiresAt)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getBidRequestStatusColor(r.status))}>
                      {getBidRequestStatusLabel(r.status)}
                    </span>
                  </td>
                </tr>
                {expanded.has(r.id) && r.bids.length > 0 && (
                  <tr key={`${r.id}-expand`} className="bg-blue-50/30 border-b border-gray-100">
                    <td colSpan={7} className="px-6 py-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">입찰 목록</p>
                      <div className="space-y-2">
                        {r.bids.map((b) => (
                          <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <div>
                              <p className="text-xs font-medium text-gray-800">{b.sellerName}</p>
                              <p className="text-xs text-gray-400">설치일: {b.installDate}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-900">{formatPrice(b.totalPrice)}</span>
                              <BidStatusBadge status={b.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {expanded.has(r.id) && r.bids.length === 0 && (
                  <tr key={`${r.id}-empty`} className="bg-blue-50/30 border-b border-gray-100">
                    <td colSpan={7} className="px-6 py-3 text-xs text-gray-400">입찰 없음</td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">요청이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
