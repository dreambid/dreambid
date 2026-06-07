// 클라이언트 전용: 쿠키 설정/삭제 유틸리티

export const CONSUMER_COOKIE = 'db_consumer_session';
export const SELLER_COOKIE = 'db_seller_session';
export const ADMIN_COOKIE = 'db_admin_session';

export interface ConsumerSession {
  consumerId: string;
  name: string;
  provider: string;
}

export interface SellerSession {
  sellerId: string;
  name: string;
  bizNum?: string;
}

const MAX_AGE_7D = 60 * 60 * 24 * 7;
const MAX_AGE_8H = 60 * 60 * 8;

function encodeCookie(value: object): string {
  return btoa(encodeURIComponent(JSON.stringify(value)));
}

export function setConsumerCookie(session: ConsumerSession): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSUMER_COOKIE}=${encodeCookie(session)};path=/;SameSite=Strict;max-age=${MAX_AGE_7D}`;
}

export function setSellerCookie(session: SellerSession): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SELLER_COOKIE}=${encodeCookie(session)};path=/;SameSite=Strict;max-age=${MAX_AGE_7D}`;
}

export function setAdminCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_COOKIE}=1;path=/;SameSite=Strict;max-age=${MAX_AGE_8H}`;
}

export function clearConsumerCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSUMER_COOKIE}=;path=/;max-age=0`;
}

export function clearSellerCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SELLER_COOKIE}=;path=/;max-age=0`;
}

export function clearAdminCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_COOKIE}=;path=/;max-age=0`;
}
