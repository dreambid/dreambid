import { NextRequest, NextResponse } from 'next/server';
import { readData, insertItem, generateId } from '@/lib/data';
import type { BasketItem } from '@/types';
import { requireConsumerApi } from '@/lib/serverSession';

export function GET(req: NextRequest) {
  const session = requireConsumerApi(req);
  if (session instanceof NextResponse) return session;

  const items = readData<BasketItem>('basket.json').filter(
    (b) => b.consumerId === session.consumerId,
  );
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = requireConsumerApi(req);
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const item: BasketItem = {
    id: generateId('basket'),
    consumerId: session.consumerId,
    bidId: body.bidId,
    requestId: body.requestId,
    category: body.category,
    categoryName: body.categoryName,
    addedAt: new Date().toISOString(),
  };
  insertItem('basket.json', item);
  return NextResponse.json(item, { status: 201 });
}
