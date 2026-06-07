// 서버 전용: 세션 쿠키 읽기 유틸리티 (서버 컴포넌트 및 API Route Handler)

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { CONSUMER_COOKIE, SELLER_COOKIE, ADMIN_COOKIE } from './session';
import type { ConsumerSession, SellerSession } from './session';

function decodeCookie<T>(raw: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(atob(raw))) as T;
  } catch {
    return null;
  }
}

// 서버 컴포넌트용 — await 필요
export async function getConsumerServerSession(): Promise<ConsumerSession | null> {
  const store = await cookies();
  const raw = store.get(CONSUMER_COOKIE)?.value;
  if (!raw) return null;
  return decodeCookie<ConsumerSession>(raw);
}

export async function getSellerServerSession(): Promise<SellerSession | null> {
  const store = await cookies();
  const raw = store.get(SELLER_COOKIE)?.value;
  if (!raw) return null;
  return decodeCookie<SellerSession>(raw);
}

export async function isAdminServerSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === '1';
}

// API Route Handler용 — NextRequest.cookies 기반
export function requireConsumerApi(req: NextRequest): ConsumerSession | NextResponse {
  const raw = req.cookies.get(CONSUMER_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  const session = decodeCookie<ConsumerSession>(raw);
  if (!session) return NextResponse.json({ error: '유효하지 않은 세션' }, { status: 401 });
  return session;
}

export function requireSellerApi(req: NextRequest): SellerSession | NextResponse {
  const raw = req.cookies.get(SELLER_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  const session = decodeCookie<SellerSession>(raw);
  if (!session) return NextResponse.json({ error: '유효하지 않은 세션' }, { status: 401 });
  return session;
}

export function requireAdminApi(req: NextRequest): true | NextResponse {
  const val = req.cookies.get(ADMIN_COOKIE)?.value;
  if (val !== '1') return NextResponse.json({ error: '관리자 인증 필요' }, { status: 403 });
  return true;
}
