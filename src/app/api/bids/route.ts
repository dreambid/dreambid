import { NextRequest, NextResponse } from 'next/server';
import { readData, insertItem, updateItem, generateId } from '@/lib/data';
import type { Bid, BidRequest, CreateBidInput } from '@/types';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const sellerId = searchParams.get('sellerId');

  let bids = readData<Bid>('bids.json');
  if (requestId) bids = bids.filter((b) => b.requestId === requestId);
  if (sellerId) bids = bids.filter((b) => b.sellerId === sellerId);

  return NextResponse.json(bids);
}

export async function POST(req: NextRequest) {
  const body: CreateBidInput = await req.json();
  const now = new Date().toISOString();

  const totalPrice = body.items.reduce((s, i) => Math.max(s, i.price), 0);

  const newBid: Bid = {
    id: generateId('bid'),
    requestId: body.requestId,
    sellerId: 'seller-001',
    sellerName: '박판매 가전',
    sellerRating: 4.8,
    items: body.items.map((item, idx) => ({
      id: generateId('bi'),
      modelName: item.modelName,
      price: item.price,
      sortOrder: idx + 1,
    })),
    totalPrice,
    installDate: body.installDate,
    installFeeIncluded: body.installFeeIncluded,
    collectionService: body.collectionService,
    sellerMessage: body.sellerMessage,
    status: 'pending',
    isRebid: false,
    createdAt: now,
    updatedAt: now,
  };

  insertItem('bids.json', newBid);

  // 비딩 수 및 요청 상태 업데이트
  const currentBidCount = readData<Bid>('bids.json').filter(
    (b) => b.requestId === body.requestId,
  ).length;
  updateItem<BidRequest>('bid-requests.json', body.requestId, {
    bidCount: currentBidCount,
    status: 'bidding',
    updatedAt: now,
  });

  return NextResponse.json(newBid, { status: 201 });
}
