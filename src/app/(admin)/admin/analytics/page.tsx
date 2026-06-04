import { readData } from '@/lib/data';
import type { BidRequest } from '@/types/bidRequest';
import type { Bid } from '@/types';
import type { Order } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';

const CATEGORY_NAMES: Record<string, string> = {
  tv: 'TV',
  refrigerator: '냉장고',
  'air-conditioner': '에어컨',
  'washing-machine': '세탁기',
  'clothing-care': '의류관리기',
};

export default function AdminAnalyticsPage() {
  const requests = readData<BidRequest>('bid-requests.json');
  const bids = readData<Bid>('bids.json');
  const orders = readData<Order>('orders.json');

  const requestCount = requests.length;
  const biddingCount = requests.filter((r) => r.status !== 'open').length;
  const selectedCount = requests.filter((r) => r.status === 'selected' || r.status === 'completed').length;
  const paidCount = orders.length;

  const funnelData = [
    { name: `요청 (${requestCount})`, value: requestCount, fill: '#3b82f6' },
    { name: `입찰 (${biddingCount})`, value: biddingCount, fill: '#8b5cf6' },
    { name: `낙찰 (${selectedCount})`, value: selectedCount, fill: '#f59e0b' },
    { name: `결제 (${paidCount})`, value: paidCount, fill: '#10b981' },
  ];

  const categoryStats = Object.entries(CATEGORY_NAMES).map(([key, category]) => ({
    category,
    requests: requests.filter((r) => r.category === key).length,
    bids: bids.filter((b) => {
      const req = requests.find((r) => r.id === b.requestId);
      return req?.category === key;
    }).length,
  }));

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commissionAmount, 0);
  const avgBidsPerRequest = requestCount > 0 ? (bids.length / requestCount).toFixed(1) : '0';
  const conversionRate = requestCount > 0 ? ((paidCount / requestCount) * 100).toFixed(0) : '0';

  const kpiCards = [
    { label: '총 거래액', value: formatPrice(totalRevenue), sub: '누적' },
    { label: '총 수수료 수입', value: formatPrice(totalCommission), sub: '2% 기준' },
    { label: '요청당 평균 입찰', value: `${avgBidsPerRequest}건`, sub: '경쟁률' },
    { label: '전환율', value: `${conversionRate}%`, sub: '요청→결제' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">통계/분석</h1>
        <p className="text-sm text-gray-500 mt-1">플랫폼 핵심 지표 및 전환 퍼널</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <AnalyticsCharts categoryStats={categoryStats} funnelData={funnelData} />
    </div>
  );
}
