import { notFound } from 'next/navigation';
import { findById, readData } from '@/lib/data';
import type { BidRequest, Bid } from '@/types';
import { getSpecLabel, formatRelativeTime, formatPrice } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import BidSubmitForm from './BidSubmitForm';

interface Props {
  params: Promise<{ id: string }>;
}

const MY_SELLER_ID = 'seller-001';

export default async function SellerRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = findById<BidRequest>('bid-requests.json', id);
  if (!request) notFound();

  const allBids = readData<Bid>('bids.json');
  const existingBids = allBids.filter((b) => b.requestId === request.id);
  const lowestPrice =
    existingBids.length > 0 ? Math.min(...existingBids.map((b) => b.totalPrice)) : null;
  const myBid = existingBids.find((b) => b.sellerId === MY_SELLER_ID);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 요청 정보 */}
      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">{CATEGORY_ICONS[request.category]}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {request.categoryName} 비딩 요청
            </h1>
            <p className="text-sm text-gray-400">
              마감: {formatRelativeTime(request.expiresAt)} · {request.bidCount}개 비딩 접수됨
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(request.specs).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
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

        {lowestPrice !== null && (
          <div className="rounded-xl bg-yellow-50 p-3 text-sm">
            <span className="font-medium text-yellow-700">현재 최저 비딩: </span>
            <span className="font-bold text-yellow-800">{formatPrice(lowestPrice)}</span>
          </div>
        )}
      </div>

      {/* 비딩 작성 폼 or 이미 제출 안내 */}
      {myBid ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">이미 비딩을 제출했습니다</h2>
          <p className="text-sm text-gray-500">
            제출 금액: {formatPrice(myBid.totalPrice)}
          </p>
          {myBid.status === 'pending' && (
            <p className="mt-2 text-xs text-blue-600">
              대기중 — 리비딩(재견적)을 제출할 수 있습니다
            </p>
          )}
        </div>
      ) : (
        <BidSubmitForm requestId={request.id} />
      )}
    </div>
  );
}
