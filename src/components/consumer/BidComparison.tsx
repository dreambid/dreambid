'use client';

import { formatPrice, formatDate } from '@/lib/utils';
import type { Bid } from '@/types';

interface BidComparisonProps {
  bids: Bid[];
  onSelect?: (bid: Bid) => void;
}

const collectionLabel: Record<string, string> = {
  free: '무료',
  paid: '유료',
  unavailable: '불가',
};

/* 최대 4개 비딩 나란히 비교 테이블 — 최저가 자동 하이라이트 */
export function BidComparison({ bids, onSelect }: BidComparisonProps) {
  if (bids.length === 0) return null;

  const minPrice = Math.min(...bids.map((b) => b.totalPrice));

  const rows: Array<{ label: string; render: (bid: Bid) => React.ReactNode }> = [
    { label: '판매자', render: (b) => <span className="font-semibold">{b.sellerName}</span> },
    { label: '평점', render: (b) => <span>{'★'.repeat(Math.round(b.sellerRating))} {b.sellerRating.toFixed(1)}</span> },
    { label: '제안 모델', render: (b) => <span>{b.items[0]?.modelName ?? '-'}</span> },
    {
      label: '총 금액',
      render: (b) => (
        <span className={b.totalPrice === minPrice ? 'font-bold text-blue-600' : 'font-medium text-gray-900'}>
          {formatPrice(b.totalPrice)}
          {b.totalPrice === minPrice && <span className="ml-1 text-xs text-blue-500">최저가</span>}
        </span>
      ),
    },
    { label: '설치일', render: (b) => <span>{formatDate(b.installDate)}</span> },
    { label: '설치비', render: (b) => <span>{b.installFeeIncluded ? '포함' : '별도'}</span> },
    { label: '수거 서비스', render: (b) => <span>{collectionLabel[b.collectionService]}</span> },
    { label: '판매자 한마디', render: (b) => <span className="line-clamp-2 text-xs text-gray-500">{b.sellerMessage ?? '-'}</span> },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 bg-gray-50 p-3 text-left text-xs font-medium text-gray-500" />
            {bids.map((bid) => (
              <th key={bid.id} className={`p-3 text-center ${bid.totalPrice === minPrice ? 'bg-blue-50' : 'bg-white'}`}>
                <span className="font-semibold text-gray-900">{bid.sellerName}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-gray-100">
              <td className="bg-gray-50 p-3 text-xs font-medium text-gray-500">{row.label}</td>
              {bids.map((bid) => (
                <td key={bid.id} className={`p-3 text-center ${bid.totalPrice === minPrice ? 'bg-blue-50/50' : ''}`}>
                  {row.render(bid)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {onSelect && (
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="bg-gray-50 p-3" />
              {bids.map((bid) => (
                <td key={bid.id} className={`p-3 text-center ${bid.totalPrice === minPrice ? 'bg-blue-50/50' : ''}`}>
                  <button
                    onClick={() => onSelect(bid)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    이 비딩 선택
                  </button>
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
