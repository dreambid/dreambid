export type AuctionStatus = 'draft' | 'active' | 'bidding' | 'accepted' | 'completed' | 'cancelled';

export type AuctionCondition = 'new' | 'refurbished' | 'used';

export interface Auction {
  id: string;
  consumerId: string;
  categoryId: string;
  productId?: string;
  title: string;
  description: string;
  targetBudget: number;
  minBudget: number;
  condition: AuctionCondition;
  status: AuctionStatus;
  deadline: string;
  location: string;
  images: string[];
  requirements: string[];
  viewCount: number;
  bidCount: number;
  acceptedBidId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionFilter {
  categoryId?: string;
  status?: AuctionStatus;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  keyword?: string;
}

export interface CreateAuctionInput {
  categoryId: string;
  productId?: string;
  title: string;
  description: string;
  targetBudget: number;
  minBudget: number;
  condition: AuctionCondition;
  deadline: string;
  location: string;
  requirements: string[];
}
