import { readData } from '@/lib/data';
import type { Bid, BidRequest, Order } from '@/types';
import SellerBidsClient from './SellerBidsClient';
import { getSellerServerSession } from '@/lib/serverSession';

export default async function SellerBidsPage() {
  const session = await getSellerServerSession();
  const MY_SELLER_ID = session?.sellerId ?? 'seller-001';

  const myBids = readData<Bid>('bids.json').filter((b) => b.sellerId === MY_SELLER_ID);
  const requests = readData<BidRequest>('bid-requests.json');
  const orders = readData<Order>('orders.json').filter((o) => o.sellerId === MY_SELLER_ID);

  const bidsWithRequests = myBids.map((bid) => ({
    bid,
    request: requests.find((r) => r.id === bid.requestId),
  }));

  return <SellerBidsClient items={bidsWithRequests} orders={orders} />;
}
