import Link from 'next/link';
import { readData, findById } from '@/lib/data';
import type { BidRequest, Bid, Seller, Order } from '@/types';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';

// 현재 로그인 판매자: seller-001 (하드코딩)
const MY_SELLER_ID = 'seller-001';

export default function SellerDashboardPage() {
  const seller = findById<Seller>('sellers.json', MY_SELLER_ID)!;
  const allRequests = readData<BidRequest>('bid-requests.json');
  const myBids = readData<Bid>('bids.json').filter((b) => b.sellerId === MY_SELLER_ID);
  const myOrders = readData<Order>('orders.json').filter((o) => o.sellerId === MY_SELLER_ID);

  const openRequests = allRequests.filter((r) => ['open', 'bidding'].includes(r.status));
  const pendingBids = myBids.filter((b) => b.status === 'pending');
  const selectedBids = myBids.filter((b) => b.status === 'selected');
  const monthRevenue = myOrders
    .filter((o) => o.sellerAmount > 0)
    .reduce((s, o) => s + o.sellerAmount, 0);

  const stats = [
    { label: '입찰 가능 요청', value: openRequests.length, sub: '건' },
    { label: '대기중 비딩', value: pendingBids.length, sub: '건' },
    { label: '낙찰 건수', value: selectedBids.length, sub: '건' },
    { label: '이번 달 매출', value: formatPrice(monthRevenue), sub: '' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {seller.companyName}님 👋
          </h1>
          <p className="text-sm text-gray-500">
            평점 ⭐ {seller.rating} ({seller.reviewCount}개 리뷰)
          </p>
        </div>
        <Link
          href="/seller/requests"
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          비딩 요청 보기
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stat.value}
              {stat.sub && (
                <span className="ml-1 text-base font-normal text-gray-400">{stat.sub}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* 최신 비딩 요청 */}
      <h2 className="mb-4 font-semibold text-gray-900">최신 비딩 요청</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {openRequests.slice(0, 6).map((req) => (
          <Link
            key={req.id}
            href={`/seller/requests/${req.id}`}
            className="block rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[req.category]}</span>
              <span className="font-semibold text-gray-800">{req.categoryName}</span>
              <span className="ml-auto text-xs text-gray-400">{req.bidCount}개 비딩</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.values(req.specs)
                .slice(0, 3)
                .map((v, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {v}
                  </span>
                ))}
            </div>
            <p className="mt-3 text-xs font-medium text-orange-500">
              마감 {formatRelativeTime(req.expiresAt)}
            </p>
          </Link>
        ))}
      </div>

      {openRequests.length === 0 && (
        <div className="rounded-2xl border bg-white py-12 text-center text-gray-400">
          현재 입찰 가능한 비딩 요청이 없습니다
        </div>
      )}
    </div>
  );
}
