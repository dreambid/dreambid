import { findById } from '@/lib/data';
import type { Seller } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';

const MY_SELLER_ID = 'seller-001';

const statusLabel: Record<string, string> = {
  pending: '심사중',
  approved: '승인됨',
  suspended: '정지됨',
  withdrawn: '탈퇴',
};

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-600',
  withdrawn: 'bg-gray-100 text-gray-500',
};

const brandLabel: Record<string, string> = {
  samsung: '삼성',
  lg: 'LG',
  carrier: '캐리어',
};

export default function SellerProfilePage() {
  const seller = findById<Seller>('sellers.json', MY_SELLER_ID);

  if (!seller) {
    return (
      <div className="p-8 text-center text-gray-400">판매자 정보를 불러올 수 없습니다</div>
    );
  }

  const infoRows: Array<[string, string]> = [
    ['상호명', seller.companyName],
    ['대표자', seller.ceoName],
    ['사업자번호', seller.bizNumber],
    ['담당자', seller.managerName],
    ['담당자 연락처', seller.managerPhone],
    ['이메일', seller.email],
    ['주소', seller.address],
    ['가입일', formatDate(seller.createdAt)],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">내 프로필</h1>

      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">사업자 정보</h2>
            <Badge
              label={statusLabel[seller.status] ?? seller.status}
              className={statusColor[seller.status] ?? 'bg-gray-100 text-gray-600'}
            />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {infoRows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-400">{label}</dt>
                <dd className="font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 거래 실적 */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">거래 실적</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{seller.totalBids}</p>
              <p className="text-xs text-gray-400">총 비딩 수</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{seller.acceptedBids}</p>
              <p className="text-xs text-gray-400">낙찰 건수</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">⭐ {seller.rating}</p>
              <p className="text-xs text-gray-400">({seller.reviewCount}개 리뷰)</p>
            </div>
          </div>
        </div>

        {/* 취급 브랜드 / 품목 */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">취급 브랜드 / 품목</h2>
          <div className="flex flex-wrap gap-2">
            {seller.brands.map((b) => (
              <span
                key={b}
                className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                {brandLabel[b] ?? b}
              </span>
            ))}
          </div>
        </div>

        {/* 정산 계좌 */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">정산 계좌</h2>
          <p className="text-sm text-gray-700">
            {seller.bankName} · {seller.accountNumber} · {seller.accountHolder}
          </p>
        </div>
      </div>
    </div>
  );
}
