export const APP_NAME = '드림비드';
export const APP_TAGLINE = '더 싸게, 더 안전하게';
export const APP_DESCRIPTION = '가전제품 프라이빗 역경매 플랫폼 — 판매자가 경쟁하고, 소비자가 선택합니다';

export const ROUTES = {
  HOME: '/',
  CONSUMER: {
    REQUESTS: '/requests',
    NEW_REQUEST: '/request/new',
    REQUEST_DETAIL: (id: string) => `/requests/${id}`,
    BASKET: '/basket',
    COMPARE: '/compare',
    PROFILE: '/profile',
  },
  SELLER: {
    DASHBOARD: '/seller',
    REQUESTS: '/seller/requests',
    REQUEST_DETAIL: (id: string) => `/seller/requests/${id}`,
    BIDS: '/seller/bids',
    PROFILE: '/seller/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    CONSUMERS: '/admin/consumers',
    SELLERS: '/admin/sellers',
    BIDS: '/admin/bids',
    SETTLEMENTS: '/admin/settlements',
    ANALYTICS: '/admin/analytics',
    CONTENT: '/admin/content',
    SETTINGS: '/admin/settings',
  },
} as const;

export const CATEGORY_ICONS: Record<string, string> = {
  tv: '📺',
  refrigerator: '🧊',
  'air-conditioner': '❄️',
  'washing-machine': '🫧',
  'clothing-care': '👔',
};

export const CATEGORY_NAMES: Record<string, string> = {
  tv: 'TV',
  refrigerator: '냉장고',
  'air-conditioner': '에어컨',
  'washing-machine': '세탁기/건조기',
  'clothing-care': '의류관리기',
};
