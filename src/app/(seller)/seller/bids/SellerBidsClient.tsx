'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Bid, BidRequest } from '@/types';
import { Badge } from '@/components/shared/Badge';
import { formatPrice, formatDate, getBidStatusLabel } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';

type Tab = 'all' | 'pending' | 'selected' | 'failed';

interface Item {
  bid: Bid;
  request?: BidRequest;
}

interface Props {
  items: Item[];
}

const tabLabels: Record<Tab, string> = {
  all: '전체',
  pending: '대기중',
  selected: '낙찰',
  failed: '미선택',
};

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  selected: 'bg-green-100 text-green-700',
  failed: 'bg-gray-100 text-gray-500',
  withdrawn: 'bg-red-100 text-red-500',
};

const collectionLabel: Record<string, string> = {
  free: '무료',
  paid: '유료',
  unavailable: '불가',
};

export default function SellerBidsClient({ items }: Props) {
  const [tab, setTab] = useState<Tab>('all');

  const filtered = tab === 'all' ? items : items.filter((i) => i.bid.status === tab);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">내 비딩 관리</h1>

      {/* 탭 */}
      <div className="mb-6 flex gap-2 border-b">
        {(Object.keys(tabLabels) as Tab[]).map((t) => {
          const count =
            t === 'all' ? items.length : items.filter((i) => i.bid.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabels[t]}{' '}
              <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 비딩 목록 */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400">해당 비딩이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ bid, request }) => (
            <div key={bid.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {request && (
                    <span className="text-xl">{CATEGORY_ICONS[request.category]}</span>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {request?.categoryName ?? '알 수 없음'}
                    </p>
                    <p className="text-xs text-gray-400">제출일: {formatDate(bid.createdAt)}</p>
                  </div>
                </div>
                <Badge
                  label={getBidStatusLabel(bid.status)}
                  className={statusColor[bid.status] ?? 'bg-gray-100 text-gray-600'}
                />
              </div>

              {/* 제안 모델 목록 */}
              <div className="mb-3 space-y-2">
                {bid.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2"
                  >
                    <span className="text-sm text-gray-700">{item.modelName}</span>
                    <span className="font-semibold text-green-700">{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  설치: {bid.installDate} · 설치비 {bid.installFeeIncluded ? '포함' : '별도'} ·
                  수거 {collectionLabel[bid.collectionService] ?? bid.collectionService}
                </span>
                {bid.status === 'pending' && request && (
                  <Link
                    href={`/seller/requests/${request.id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    리비딩 →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
