import { NextRequest, NextResponse } from 'next/server';
import { deleteItem } from '@/lib/data';
import { requireConsumerApi } from '@/lib/serverSession';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = requireConsumerApi(req);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const ok = deleteItem('basket.json', id);
  if (!ok) return NextResponse.json({ error: '없음' }, { status: 404 });
  return NextResponse.json({ success: true });
}
