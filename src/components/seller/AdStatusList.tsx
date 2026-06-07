'use client';

import { useEffect, useState } from 'react';
import type { Ad, AdStatus } from '@/types/ad';
import { AD_CATEGORIES } from '@/types/ad';

interface Props {
  sellerId: string;
}

const STATUS_BADGE: Record<AdStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<AdStatus, string> = {
  pending: '검토중',
  active: '노출중',
  expired: '종료',
  rejected: '거절',
};

function formatDate(iso?: string) {
  if (!iso) return '-';
  return iso.slice(0, 10);
}

export default function AdStatusList({ sellerId }: Props) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads?sellerId=${sellerId}`)
      .then((r) => r.json())
      .then((data: Ad[]) => setAds(data))
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>;
  }

  if (ads.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">📢</p>
        <p className="text-gray-500 text-sm">등록된 홍보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-6 max-w-lg mx-auto">
      {ads.map((ad) => (
        <div key={ad.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="font-bold text-gray-900 text-sm">{ad.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${STATUS_BADGE[ad.status]}`}>
              {STATUS_LABEL[ad.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {ad.categories.map((catId) => {
              const cat = AD_CATEGORIES.find((c) => c.id === catId);
              return (
                <span key={catId} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {cat?.label ?? catId}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mb-1">
            기간: {formatDate(ad.startDate)} ~ {formatDate(ad.endDate)}
          </p>
          <p className="text-xs text-gray-400">클릭수: {ad.clickCount}</p>
        </div>
      ))}
    </div>
  );
}
