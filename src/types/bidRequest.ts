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
}

export interface CreateBidRequestInput {
  category: BidRequestCategory;
  specs: Record<string, string>;
  modelName?: string;
}
