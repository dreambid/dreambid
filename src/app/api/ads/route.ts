import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/data';
import type { Ad, AdCategory } from '@/types/ad';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category') as AdCategory | null;
  const sellerId = searchParams.get('sellerId');

  let ads = readData<Ad>('ads.json');
  if (status) ads = ads.filter((a) => a.status === status);
  if (category) ads = ads.filter((a) => a.categories.includes(category));
  if (sellerId) ads = ads.filter((a) => a.sellerId === sellerId);

  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    sellerId: string;
    sellerName: string;
    title: string;
    imageUrl: string;
    description: string;
    categories: AdCategory[];
    duration: Ad['duration'];
    contact: string;
  };

  const newAd: Ad = {
    id: generateId('ad'),
    sellerId: body.sellerId,
    sellerName: body.sellerName,
    title: body.title,
    imageUrl: body.imageUrl ?? '',
    description: body.description,
    categories: body.categories,
    duration: body.duration,
    contact: body.contact,
    status: 'pending',
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };

  const ads = readData<Ad>('ads.json');
  ads.push(newAd);
  writeData<Ad>('ads.json', ads);

  return NextResponse.json(newAd, { status: 201 });
}
