import { NextRequest, NextResponse } from 'next/server';
import { findById, updateItem } from '@/lib/data';
import type { BidRequest } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = findById<BidRequest>('bid-requests.json', id);
  if (!item) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = updateItem<BidRequest>('bid-requests.json', id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(updated);
}
