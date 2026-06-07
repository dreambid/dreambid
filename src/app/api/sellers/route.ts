import { NextRequest, NextResponse } from 'next/server';
import { readData, insertItem, generateId } from '@/lib/data';
import type { Seller } from '@/types';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let sellers = readData<Seller>('sellers.json');
  if (status) sellers = sellers.filter((s) => s.status === status);

  return NextResponse.json(sellers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  const seller: Seller = {
    id: generateId('seller'),
    bizNumber: body.bizNum ?? '',
    companyName: body.contactName ?? '신규 판매자',
    ceoName: body.contactName ?? '',
    address: body.extraAddr ?? '',
    managerName: body.contactName ?? '',
    managerPhone: body.contactPhone ?? '',
    storePhone: body.storePhone ?? '',
    email: body.email ?? '',
    bankCode: body.bank ?? '',
    bankName: body.bank ?? '',
    accountNumber: body.accountNum ?? '',
    accountHolder: body.contactName ?? '',
    employeesRange: body.employees || '1-5',
    salesRange: body.revenue || 'under-50b',
    brands: body.brands ?? [],
    productCategories: body.products ?? [],
    status: 'pending',
    rating: 0,
    reviewCount: 0,
    totalBids: 0,
    acceptedBids: 0,
    totalRevenue: 0,
    warningCount: 0,
    createdAt: now,
    updatedAt: now,
  } as Seller;

  insertItem('sellers.json', seller);
  return NextResponse.json(seller, { status: 201 });
}
