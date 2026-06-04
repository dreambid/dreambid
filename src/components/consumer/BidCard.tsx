'use client';

import { useState } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Bid } from '@/types';

interface BidCardProps {
  bid: Bid;
  isLowest?: boolean;
  requestStatus?: string;
  isInBasket?: boolean;
  isInCompare?: boolean;
  onAddToBasket?: (bid: Bid) => void;
  onAddToCompare?: (bid: Bid) => void;
  onSelect?: (bid: Bid) => void;
  showSelectButton?: boolean;
}

const collectionLabel: Record<string, string> = {
  free: '무료 수거',
  paid: '유료 수거',
  unavailable: '수거 불가',
};

/* 판매자 비딩 카드 */
export function BidCard({
  bid,
  isLowest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestStatus,
  isInBasket,
  isInCompare,
  onAddToBasket,
  onAddToCompare,
  onSelect,
  showSelectButton,
}: BidCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${isLowest ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-100'}`}>
      {isLowest && (
        <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
          🏆 최저가
        </div>
      )}
      {/* 판매자 정보 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-900">{bid.sellerName}</p>
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            {'★'.repeat(Math.round(bid.sellerRating))}
            <span className="text-gray-500">{bid.sellerRating.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-blue-600">{formatPrice(bid.totalPrice)}</p>
      </div>

      {/* 제안 모델명 */}
      <div className="mb-3 space-y-1">
        {bid.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-700">{item.modelName}</span>
            <span className="font-medium text-gray-900">{formatPrice(item.price)}</span>
          </div>
        ))}
      </div>

      {/* 설치 정보 */}
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">설치일 {formatDate(bid.installDate)}</span>
        <span className={`rounded-full px-2 py-1 ${bid.installFeeIncluded ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
          {bid.installFeeIncluded ? '설치비 포함' : '설치비 별도'}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">{collectionLabel[bid.collectionService]}</span>
      </div>

      {/* 판매자 한마디 */}
      {bid.sellerMessage && (
        <div className="mb-4">
          <button onClick={() => setExpanded((v) => !v)} className="text-xs text-blue-600 hover:underline">
            판매자 한마디 {expanded ? '▲' : '▼'}
          </button>
          {expanded && <p className="mt-1 text-sm text-gray-600">{bid.sellerMessage}</p>}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {onAddToBasket && (
          <button
            onClick={() => onAddToBasket(bid)}
            disabled={isInBasket}
            className="flex-1 rounded-lg border border-blue-300 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInBasket ? '바구니에 담김' : '바구니에 담기'}
          </button>
        )}
        {onAddToCompare && (
          <button
            onClick={() => onAddToCompare(bid)}
            disabled={isInCompare}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInCompare ? '비교중' : '비교 추가'}
          </button>
        )}
        {showSelectButton && onSelect && (
          <button
            onClick={() => onSelect(bid)}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            이 비딩 선택
          </button>
        )}
      </div>
    </div>
  );
}
