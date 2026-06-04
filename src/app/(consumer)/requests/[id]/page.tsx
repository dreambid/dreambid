import { notFound } from 'next/navigation';
import { findById, readData } from '@/lib/data';
import type { BidRequest, Bid } from '@/types';
import { BidCard } from '@/components/consumer/BidCard';
import { Badge } from '@/components/shared/Badge';
import {
  getBidRequestStatusLabel,
  getBidRequestStatusColor,
  formatRelativeTime,
  getSpecLabel,
} from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import RequestDetailClient from './RequestDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = findById<BidRequest>('bid-requests.json', id);
  if (!request) notFound();

  const allBids = readData<Bid>('bids.json');
  const bids = allBids.filter((b) => b.requestId === request.id);
  const sortedBids = [...bids].sort((a, b) => a.totalPrice - b.totalPrice);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 요청 정보 카드 */}
      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{CATEGORY_ICONS[request.category]}</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {request.categoryName} 비딩 요청
              </h1>
              <p className="text-sm text-gray-400">
                마감: {formatRelativeTime(request.expiresAt)}
              </p>
            </div>
          </div>
          <Badge
            label={getBidRequestStatusLabel(request.status)}
            className={getBidRequestStatusColor(request.status)}
          />
        </div>

        {/* 스펙 태그 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(request.specs).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
            >
              {getSpecLabel(request.category, key, value)}
            </span>
          ))}
          {request.modelName && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              모델: {request.modelName}
            </span>
          )}
        </div>
      </div>

      {/* 비딩 목록 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          받은 비딩 <span className="text-blue-600">({bids.length})</span>
        </h2>
        {bids.length >= 2 && (
          <RequestDetailClient bids={sortedBids} requestId={request.id} />
        )}
      </div>

      {bids.length === 0 ? (
        <div className="rounded-2xl border bg-gray-50 py-12 text-center">
          <p className="mb-2 text-3xl">⏳</p>
          <p className="text-gray-500">판매자들이 비딩을 작성 중입니다</p>
          <p className="mt-1 text-sm text-gray-400">보통 수 시간 내에 비딩이 도착합니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBids.map((bid, index) => (
            <BidCard
              key={bid.id}
              bid={bid}
              isLowest={index === 0}
              requestStatus={request.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
