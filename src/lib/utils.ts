import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(price);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffMs < 0) return '마감됨';
  if (diffHours < 1) return '1시간 미만 남음';
  if (diffHours < 24) return `${diffHours}시간 남음`;
  return `${diffDays}일 남음`;
}

export function getBidRequestStatusLabel(status: string): string {
  const map: Record<string, string> = { open: '요청중', bidding: '입찰중', selected: '낙찰완료', completed: '거래완료', cancelled: '취소됨', expired: '만료됨' };
  return map[status] ?? status;
}

export function getBidRequestStatusColor(status: string): string {
  const map: Record<string, string> = { open: 'bg-blue-100 text-blue-700', bidding: 'bg-green-100 text-green-700', selected: 'bg-purple-100 text-purple-700', completed: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-600', expired: 'bg-orange-100 text-orange-600' };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getBidStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '검토중', selected: '낙찰', failed: '미선택', withdrawn: '철회' };
  return map[status] ?? status;
}

export function getSpecLabel(category: string, key: string, value: string): string {
  const labels: Record<string, Record<string, Record<string, string>>> = {
    tv: {
      size: { '55': '55인치', '65': '65인치', '75': '75인치', '85+': '85인치 이상' },
      quality: { oled: 'OLED', qled: 'QLED', '4k-uhd': '4K UHD', unknown: '무관' },
      brand: { samsung: '삼성', lg: 'LG', 'samsung-or-lg': '삼성 또는 LG', any: '무관' },
    },
    refrigerator: {
      type: { mini: '소형/미니', general: '일반형', 'side-by-side': '양문형', 'french-door': '4도어' },
      capacity: { 'under-200': '200L 미만', '200-400': '200~400L', '400-600': '400~600L', '600-800': '600~800L', '800+': '800L 이상' },
      energy: { grade1: '1등급', grade2: '2등급', any: '무관' },
      color: { white: '화이트', silver: '실버', black: '블랙', bespoke: '컬러', any: '무관' },
    },
    'air-conditioner': {
      type: { wall: '벽걸이', stand: '스탠드', '2in1': '2in1 멀티형', dual: '냉난방기기' },
      area: { 'under-6': '6평 이하', '10-12': '10~12평', '15': '15평', '18': '18평', '20+': '20평 이상' },
      brand: { samsung: '삼성', lg: 'LG', carrier: '캐리어', any: '무관' },
    },
    'washing-machine': {
      type: { drum: '드럼세탁기', pulsator: '통돌이', washtower: '워시타워', set: '세탁+건조 세트', dryer: '건조기 단독' },
      capacity: { 'under-12': '12kg 이하', '14-17': '14~17kg', '18-21': '18~21kg', '22+': '22kg 이상' },
      brand: { samsung: '삼성', lg: 'LG', any: '무관' },
    },
    'clothing-care': {
      brand: { samsung: '삼성(에어드레서)', lg: 'LG(스타일러)', any: '무관' },
      capacity: { '3': '3벌형', '5': '5벌형', '9': '9벌형' },
    },
  };
  return labels[category]?.[key]?.[value] ?? value;
}
