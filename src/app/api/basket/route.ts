import { NextRequest, NextResponse } from 'next/server';
import { readData, insertItem, generateId } from '@/lib/data';
import type { BasketItem } from '@/types';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consumerId = searchParams.get('consumerId') ?? 'consumer-001';
  const items = readData<BasketItem>('basket.json').filter(
    (b) => b.consumerId === consumerId,
  );
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item: BasketItem = {
    id: generateId('basket'),
    consumerId: 'consumer-001',
    bidId: body.bidId,
    requestId: body.requestId,
    category: body.category,
    categoryName: body.categoryName,
    addedAt: new Date().toISOString(),
  };
  insertItem('basket.json', item);
  return NextResponse.json(item, { status: 201 });
}
