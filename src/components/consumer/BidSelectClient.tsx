'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Bid } from '@/types';
import { BidCard } from './BidCard';

interface Props {
  bids: Bid[];
  requestId: string;
  canAccept: boolean;
}

export default function BidSelectClient({ bids, requestId, canAccept }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  async function handleSelect(bid: Bid) {
    setAccepting(bid.id);
    setError('');
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/bid-requests/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'selected', acceptedBidId: bid.id }),
        }),
        fetch(`/api/bids/${bid.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'selected' }),
        }),
      ]);
      if (r1.ok && r2.ok) {
        setAccepted(true);
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError('수락 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setAccepting(null);
    }
  }

  if (accepted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <p className="mb-3 text-4xl">✅</p>
        <p className="text-lg font-bold text-green-800">낙찰 완료!</p>
        <p className="mt-1 text-sm text-green-600">판매자에게 알림이 전송됩니다</p>
        <p className="mt-3 text-xs text-gray-400">잠시 후 페이지가 갱신됩니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
      {bids.map((bid, index) => (
        <div key={bid.id} className="relative">
          <BidCard
            bid={bid}
            isLowest={index === 0}
            showSelectButton={canAccept}
            onSelect={canAccept ? handleSelect : undefined}
          />
          {accepting === bid.id && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
              <p className="text-sm font-semibold text-blue-600">낙찰 처리 중...</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
