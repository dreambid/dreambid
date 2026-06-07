export type AdStatus = 'pending' | 'active' | 'expired' | 'rejected';

export type AdCategory =
  | 'tv'
  | 'refrigerator'
  | 'air-conditioner'
  | 'washing-machine'
  | 'clothing-care'
  | 'main';

export type AdDuration = '1week' | '2weeks' | '1month';

export interface Ad {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  imageUrl: string;
  description: string;
  categories: AdCategory[];
  duration: AdDuration;
  contact: string;
  status: AdStatus;
  clickCount: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const DURATION_DAYS: Record<AdDuration, number> = {
  '1week': 7,
  '2weeks': 14,
  '1month': 30,
};

export const AD_CATEGORIES: { id: AdCategory; label: string }[] = [
  { id: 'tv', label: 'TV' },
  { id: 'refrigerator', label: '냉장고' },
  { id: 'air-conditioner', label: '에어컨' },
  { id: 'washing-machine', label: '세탁기' },
  { id: 'clothing-care', label: '의류관리기' },
  { id: 'main', label: '메인전체' },
];
