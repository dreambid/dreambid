import { NextRequest, NextResponse } from 'next/server';
import { readData, insertItem, generateId } from '@/lib/data';
import type { BidRequest, CreateBidRequestInput } from '@/types';
import { requireConsumerApi } from '@/lib/serverSession';

const CATEGORY_NAMES: Record<string, string> = {
  tv: 'TV',
  refrigerator: '냉장고',
  'air-conditioner': '에어컨',
  'washing-machine': '세탁기/건조기',
  'clothing-care': '의류관리기',
};

export function GET(req: NextRequest) {
  const session = requireConsumerApi(req);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let requests = readData<BidRequest>('bid-requests.json').filter(
    (r) => r.consumerId === session.consumerId,
  );
  if (status) requests = requests.filter((r) => r.status === status);

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = requireConsumerApi(req);
  if (session instanceof NextResponse) return session;

  const body: CreateBidRequestInput = await req.json();
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newRequest: BidRequest = {
    id: generateId('br'),
    consumerId: session.consumerId,
    category: body.category,
    categoryName: CATEGORY_NAMES[body.category] ?? body.category,
    specs: body.specs,
    modelName: body.modelName ?? '',
    status: 'open',
    bidCount: 0,
    selectedBidId: undefined,
    expiresAt: expires,
    createdAt: now,
    updatedAt: now,
    quantity: body.quantity,
    deliveryDate: body.deliveryDate,
    recyclablePickup: body.recyclablePickup,
    liftRequired: body.liftRequired,
    budgetMin: body.budgetMin,
    budgetMax: body.budgetMax,
    memo: body.memo,
    deliveryRecipient: body.deliveryRecipient,
    deliveryPhone: body.deliveryPhone,
    deliveryZipCode: body.deliveryZipCode,
    deliveryAddress: body.deliveryAddress,
    deliveryAddressDetail: body.deliveryAddressDetail,
    deliveryLabel: body.deliveryLabel,
  };

  insertItem('bid-requests.json', newRequest);
  return NextResponse.json(newRequest, { status: 201 });
}
