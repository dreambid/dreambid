'use client';

import { useState } from 'react';
import type { Ad, AdStatus } from '@/types/ad';
import { AD_CATEGORIES } from '@/types/ad';

interface Props {
  pendingAds: Ad[];
  allAds: Ad[];
}

type Tab = 'pending' | 'all';

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

async function patchAd(id: string, action: 'approve' | 'reject') {
  await fetch(`/api/ads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  window.location.reload();
}

function AdCard({ ad, showActions }: { ad: Ad; showActions: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{ad.sellerName}</p>
          <p className="font-bold text-gray-900 text-sm">{ad.title}</p>
        </div>
        {!showActions && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${STATUS_BADGE[ad.status]}`}>
            {STATUS_LABEL[ad.status]}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-2">{ad.description}</p>
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
      <p className="text-xs text-gray-400 mb-3">기간: {ad.duration} · 연락처: {ad.contact}</p>
      {showActions && (
        <div className="flex gap-2">
          <button onClick={() => patchAd(ad.id, 'approve')}
            className="flex-1 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors">
            승인
          </button>
          <button onClick={() => patchAd(ad.id, 'reject')}
            className="flex-1 rounded-lg border border-red-300 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
            거절
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdsAdminClient({ pendingAds, allAds }: Props) {
  const [tab, setTab] = useState<Tab>('pending');
  const list = tab === 'pending' ? pendingAds : allAds;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">광고 관리</h1>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['pending', 'all'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'pending' ? `대기중 (${pendingAds.length})` : `전체 (${allAds.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">광고가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {list.map((ad) => (
            <AdCard key={ad.id} ad={ad} showActions={tab === 'pending'} />
          ))}
        </div>
      )}
    </div>
  );
}
