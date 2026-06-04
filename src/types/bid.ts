export type BidStatus = 'pending' | 'selected' | 'failed' | 'withdrawn';
export type CollectionService = 'free' | 'paid' | 'unavailable';

export interface BidItem {
  id: string;
  modelName: string;
  price: number;
  sortOrder: number;
}

export interface Bid {
  id: string;
  requestId: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  items: BidItem[];
  totalPrice: number;
  installDate: string;
  installFeeIncluded: boolean;
  collectionService: CollectionService;
  sellerMessage?: string;
  status: BidStatus;
  isRebid: boolean;
  previousPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BasketItem {
  id: string;
  consumerId: string;
  bidId: string;
  requestId: string;
  category: string;
  categoryName: string;
  addedAt: string;
}

export interface PackageBid {
  id: string;
  requestIds: string[];
  sellerId: string;
  sellerName: string;
  totalPrice: number;
  giftDescription?: string;
  installDate: string;
  sellerMessage?: string;
  status: BidStatus;
  createdAt: string;
}

export interface CreateBidInput {
  requestId: string;
  items: Array<{ modelName: string; price: number }>;
  installDate: string;
  installFeeIncluded: boolean;
  collectionService: CollectionService;
  sellerMessage?: string;
}
