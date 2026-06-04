import { readData } from '@/lib/data';
import type { Bid, BidRequest } from '@/types';
import SellerBidsClient from './SellerBidsClient';

const MY_SELLER_ID = 'seller-001';

export default function SellerBidsPage() {
  const myBids = readData<Bid>('bids.json').filter((b) => b.sellerId === MY_SELLER_ID);
  const requests = readData<BidRequest>('bid-requests.json');

  const bidsWithRequests = myBids.map((bid) => ({
    bid,
    request: requests.find((r) => r.id === bid.requestId),
  }));

  return <SellerBidsClient items={bidsWithRequests} />;
}
