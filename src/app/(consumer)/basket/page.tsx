import { readData, findById } from '@/lib/data';
import type { BasketItem, Bid } from '@/types';
import BasketClient from './BasketClient';
import { getConsumerServerSession } from '@/lib/serverSession';

export default async function BasketPage() {
  const session = await getConsumerServerSession();
  const consumerId = session?.consumerId ?? '';

  const basket = readData<BasketItem>('basket.json').filter(
    (b) => b.consumerId === consumerId,
  );

  const bidsWithDetails = basket
    .map((item) => {
      const bid = findById<Bid>('bids.json', item.bidId);
      return { basketItem: item, bid };
    })
    .filter(
      (item): item is { basketItem: BasketItem; bid: Bid } => item.bid !== undefined,
    );

  return <BasketClient items={bidsWithDetails} />;
}
