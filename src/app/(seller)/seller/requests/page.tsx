import { readData } from '@/lib/data';
import type { BidRequest } from '@/types';
import SellerRequestList from './SellerRequestList';

export default function SellerRequestsPage() {
  const requests = readData<BidRequest>('bid-requests.json')
    .filter((r) => ['open', 'bidding'].includes(r.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <SellerRequestList initialRequests={requests} />;
}
