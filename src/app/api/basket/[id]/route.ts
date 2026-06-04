import { NextRequest, NextResponse } from 'next/server';
import { deleteItem } from '@/lib/data';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteItem('basket.json', id);
  if (!ok) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json({ success: true });
}
