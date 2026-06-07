const CONSUMER_KEY = 'dreambid_consumer';
const ADMIN_KEY = 'dreambid_admin';

export interface ConsumerUser {
  name: string;
  provider: 'kakao' | 'naver' | 'google' | 'apple';
}

export function getConsumerUser(): ConsumerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSUMER_KEY);
    return raw ? (JSON.parse(raw) as ConsumerUser) : null;
  } catch {
    return null;
  }
}

export function setConsumerUser(user: ConsumerUser): void {
  localStorage.setItem(CONSUMER_KEY, JSON.stringify(user));
}

export function clearConsumerUser(): void {
  localStorage.removeItem(CONSUMER_KEY);
}

export function isConsumerLoggedIn(): boolean {
  return getConsumerUser() !== null;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_KEY) === '1';
}

export function setAdminLoggedIn(): void {
  sessionStorage.setItem(ADMIN_KEY, '1');
}

export function clearAdminLoggedIn(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}

export const ADMIN_CREDENTIALS = { id: 'admin', password: 'admin1234' };

/* ── 판매자 세션 ── */

const SELLER_KEY = 'dreambid_seller';

export interface SellerUser {
  name: string;
  bizNum?: string;
}

export function getSellerUser(): SellerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SELLER_KEY);
    return raw ? (JSON.parse(raw) as SellerUser) : null;
  } catch {
    return null;
  }
}

export function setSellerUser(user: SellerUser): void {
  localStorage.setItem(SELLER_KEY, JSON.stringify(user));
}

export function clearSellerUser(): void {
  localStorage.removeItem(SELLER_KEY);
}

export function isSellerLoggedIn(): boolean {
  return getSellerUser() !== null;
}
