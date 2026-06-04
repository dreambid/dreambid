import { readData } from '@/lib/data';
import type { BidRequest } from '@/types/bidRequest';
import type { Bid } from '@/types';
import BidsClient from './BidsClient';

export default function AdminBidsPage() {
  const requests = readData<BidRequest>('bid-requests.json');
  const bids = readData<Bid>('bids.json');

  const data = requests.map((r) => ({
    ...r,
    bids: bids.filter((b) => b.requestId === r.id),
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalBids = bids.length;
  const activeBids = bids.filter((b) => b.status === 'pending').length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">입찰 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          요청 {requests.length}건 · 총 입찰 {totalBids}건 · 검토중 {activeBids}건
        </p>
      </div>
      <BidsClient data={data} />
    </div>
  );
}
