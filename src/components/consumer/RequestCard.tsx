import Link from 'next/link';
import { Badge } from '@/components/shared/Badge';
import { getBidRequestStatusLabel, getBidRequestStatusColor, formatRelativeTime, getSpecLabel } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import type { BidRequest } from '@/types';

interface RequestCardProps {
  request: BidRequest;
}

/* 비딩 요청 카드 — 목록 페이지에서 사용 */
export function RequestCard({ request }: RequestCardProps) {
  const specEntries = Object.entries(request.specs).slice(0, 4);

  return (
    <Link href={`/requests/${request.id}`}>
      <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
        {/* 헤더: 카테고리 + 상태 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{CATEGORY_ICONS[request.category] ?? '📦'}</span>
            <span className="font-semibold text-gray-900">{request.categoryName}</span>
          </div>
          <Badge label={getBidRequestStatusLabel(request.status)} className={getBidRequestStatusColor(request.status)} />
        </div>

        {/* 스펙 태그 */}
        <div className="mb-3 flex flex-wrap gap-1">
          {specEntries.map(([key, value]) => (
            <span key={key} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {getSpecLabel(request.category, key, value)}
            </span>
          ))}
          {request.modelName && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              {request.modelName}
            </span>
          )}
        </div>

        {/* 하단: 비딩 수 + 마감 시간 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>비딩 {request.bidCount}개</span>
          <span>{formatRelativeTime(request.expiresAt)}</span>
        </div>
      </div>
    </Link>
  );
}
