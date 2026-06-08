export type BidRequestCategory = 'tv' | 'refrigerator' | 'air-conditioner' | 'washing-machine' | 'clothing-care';
export type BidRequestStatus = 'open' | 'bidding' | 'selected' | 'completed' | 'cancelled' | 'expired';

export interface BidRequest {
  id: string;
  consumerId: string;
  category: BidRequestCategory;
  categoryName: string;
  specs: Record<string, string>;
  modelName?: string;
  status: BidRequestStatus;
  bidCount: number;
  selectedBidId?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // 공통 배송/견적 옵션 (선택 입력)
  quantity?: number;
  deliveryDate?: string;
  recyclablePickup?: boolean;
  liftRequired?: boolean;
  budgetMin?: string;
  budgetMax?: string;
  memo?: string;
  // 배송지·연락처 (선택 입력)
  deliveryRecipient?: string;
  deliveryPhone?: string;
  deliveryZipCode?: string;
  deliveryAddress?: string;
  deliveryAddressDetail?: string;
  deliveryLabel?: string;
}

export interface CreateBidRequestInput {
  category: BidRequestCategory;
  specs: Record<string, string>;
  modelName?: string;
  quantity?: number;
  deliveryDate?: string;
  recyclablePickup?: boolean;
  liftRequired?: boolean;
  budgetMin?: string;
  budgetMax?: string;
  memo?: string;
  deliveryRecipient?: string;
  deliveryPhone?: string;
  deliveryZipCode?: string;
  deliveryAddress?: string;
  deliveryAddressDetail?: string;
  deliveryLabel?: string;
}
