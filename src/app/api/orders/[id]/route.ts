import { NextRequest, NextResponse } from 'next/server';
import { findById, updateItem } from '@/lib/data';
import type { Order } from '@/types/product';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = findById<Order>('orders.json', id);
  if (!order) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = updateItem<Order>('orders.json', id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(updated);
}
