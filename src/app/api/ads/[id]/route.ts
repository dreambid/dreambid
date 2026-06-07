import { NextRequest, NextResponse } from 'next/server';
import { findById, updateItem } from '@/lib/data';
import type { Ad } from '@/types/ad';
import { DURATION_DAYS } from '@/types/ad';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as { action: 'approve' | 'reject' | 'click' };

  const ad = findById<Ad>('ads.json', id);
  if (!ad) return NextResponse.json({ error: '없음' }, { status: 404 });

  let updates: Partial<Ad> = {};

  if (body.action === 'approve') {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + DURATION_DAYS[ad.duration]);
    updates = {
      status: 'active',
      startDate: now.toISOString(),
      endDate: end.toISOString(),
    };
  } else if (body.action === 'reject') {
    updates = { status: 'rejected' };
  } else if (body.action === 'click') {
    updates = { clickCount: ad.clickCount + 1 };
  } else {
    return NextResponse.json({ error: '잘못된 action' }, { status: 400 });
  }

  const updated = updateItem<Ad>('ads.json', id, updates);
  return NextResponse.json(updated);
}
