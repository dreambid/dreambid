'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BidRequest } from '@/types';
import { formatRelativeTime, getSpecLabel } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_NAMES } from '@/lib/constants';

interface Props {
  initialRequests: BidRequest[];
}

const categories = [
  'all',
  'tv',
  'refrigerator',
  'air-conditioner',
  'washing-machine',
  'clothing-care',
] as const;

export default function SellerRequestList({ initialRequests }: Props) {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered =
    categoryFilter === 'all'
      ? initialRequests
      : initialRequests.filter((r) => r.category === categoryFilter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">비딩 요청 목록</h1>

      {/* 품목 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-green-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat === 'all'
              ? '전체'
              : `${CATEGORY_ICONS[cat]} ${CATEGORY_NAMES[cat]}`}
          </button>
        ))}
      </div>

      {/* 요청 목록 */}
      <div className="space-y-4">
        {filtered.map((req) => (
          <div key={req.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_ICONS[req.category]}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {req.categoryName} 비딩 요청
                  </h3>
                  <p className="text-xs text-gray-400">
                    현재 {req.bidCount}개 비딩 · 마감 {formatRelativeTime(req.expiresAt)}
                  </p>
                </div>
              </div>
              <Link
                href={`/seller/requests/${req.id}`}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                입찰하기
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(req.specs).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700"
                >
                  {getSpecLabel(req.category, key, value)}
                </span>
              ))}
              {req.modelName && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  모델: {req.modelName}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            해당 품목의 비딩 요청이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
