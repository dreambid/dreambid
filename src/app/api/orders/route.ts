import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/data';
import type { Order } from '@/types';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consumerId = searchParams.get('consumerId');
  const sellerId = searchParams.get('sellerId');

  let orders = readData<Order>('orders.json');
  if (consumerId) orders = orders.filter((o) => o.consumerId === consumerId);
  if (sellerId) orders = orders.filter((o) => o.sellerId === sellerId);

  return NextResponse.json(orders);
}
