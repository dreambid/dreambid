import { readData } from '@/lib/data';
import type { BidRequest } from '@/types/bidRequest';
import type { Seller } from '@/types/seller';
import type { Consumer } from '@/types/user';
import type { Order } from '@/types/product';
import { formatPrice, formatDateTime, getBidRequestStatusLabel, getBidRequestStatusColor } from '@/lib/utils';
import DashboardCharts from '@/components/admin/DashboardCharts';
import Link from 'next/link';
import { Clock, TrendingUp, Users, Store, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const requests = readData<BidRequest>('bid-requests.json');
  const sellers = readData<Seller>('sellers.json');
  const consumers = readData<Consumer>('consumers.json');
  const orders = readData<Order>('orders.json');

  const pendingSellers = sellers.filter((s) => s.status === 'pending');
  const totalCommission = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const openRequests = requests.filter((r) => r.status === 'open' || r.status === 'bidding');

  const categoryMap: Record<string, string> = {
    tv: 'TV',
    refrigerator: '냉장고',
    'air-conditioner': '에어컨',
    'washing-machine': '세탁기',
    'clothing-care': '의류관리기',
  };
  const categoryData = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({ name: categoryMap[key] ?? key, value }));

  const stats = [
    { label: '총 소비자', value: `${consumers.length}명`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '활성 판매자', value: `${sellers.filter((s) => s.status === 'approved').length}명`, icon: Store, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '진행 중 요청', value: `${openRequests.length}건`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '누적 수수료', value: formatPrice(totalCommission), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">DreamBid 플랫폼 현황 개요</p>
      </div>

      {pendingSellers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              승인 대기 중인 판매자가 {pendingSellers.length}명 있습니다
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {pendingSellers.map((s) => s.companyName).join(', ')}
            </p>
          </div>
          <Link
            href="/admin/sellers"
            className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            검토하기
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DashboardCharts categoryData={categoryData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">최근 비딩 요청</h3>
            <Link href="/admin/bids" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {recentRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.categoryName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">입찰 {r.bidCount}건</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getBidRequestStatusColor(r.status))}>
                    {getBidRequestStatusLabel(r.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">판매자 승인 대기</h3>
            <Link href="/admin/sellers?filter=pending" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {pendingSellers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">대기 중인 판매자 없음</p>
          ) : (
            <div className="space-y-3">
              {pendingSellers.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.companyName}</p>
                    <p className="text-xs text-gray-400">{s.address}</p>
                  </div>
                  <Link
                    href={`/admin/sellers?id=${s.id}`}
                    className="text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    검토
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">정산 현황</h3>
          <Link href="/admin/settlements" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">주문 ID</th>
                <th className="text-left pb-2 font-medium">카테고리</th>
                <th className="text-right pb-2 font-medium">거래금액</th>
                <th className="text-right pb-2 font-medium">수수료</th>
                <th className="text-right pb-2 font-medium">에스크로</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-gray-600 font-mono text-xs">{o.id}</td>
                  <td className="py-2.5 text-gray-700">{o.categoryName}</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">{formatPrice(o.totalAmount)}</td>
                  <td className="py-2.5 text-right text-blue-600">{formatPrice(o.commissionAmount)}</td>
                  <td className="py-2.5 text-right">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      o.escrowStatus === 'held' ? 'bg-amber-100 text-amber-700' :
                      o.escrowStatus === 'released' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {o.escrowStatus === 'held' ? '보관중' : o.escrowStatus === 'released' ? '지급완료' : '환불됨'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
