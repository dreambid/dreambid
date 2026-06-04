import { NextRequest, NextResponse } from 'next/server';
import { findById, updateItem } from '@/lib/data';
import type { Seller } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = findById<Seller>('sellers.json', id);
  if (!seller) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(seller);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = updateItem<Seller>('sellers.json', id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(updated);
}
