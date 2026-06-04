import { NextRequest, NextResponse } from 'next/server';
import { findById, updateItem } from '@/lib/data';
import type { Consumer } from '@/types/user';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consumer = findById<Consumer>('consumers.json', id);
  if (!consumer) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(consumer);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = updateItem<Consumer>('consumers.json', id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json(updated);
}
