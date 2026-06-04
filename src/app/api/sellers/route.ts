import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/data';
import type { Seller } from '@/types';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let sellers = readData<Seller>('sellers.json');
  if (status) sellers = sellers.filter((s) => s.status === status);

  return NextResponse.json(sellers);
}
