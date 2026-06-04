export interface ProductStep {
  id: string;
  question: string;
  type: 'single';
  helpKey?: string;
  options: Array<{
    value: string;
    label: string;
    subSteps?: ProductStep[];
  }>;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  steps: ProductStep[];
  hasModelInput: boolean;
}

export interface HelpText {
  [key: string]: string;
}

export interface ProductData {
  categories: ProductCategory[];
  helpTexts: Record<string, HelpText>;
}

export interface Order {
  id: string;
  consumerId: string;
  sellerId: string;
  bidId: string;
  requestId: string;
  category: string;
  categoryName: string;
  modelName: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
  escrowStatus: 'held' | 'released' | 'refunded';
  paymentMethod: 'card' | 'transfer';
  installAddress: string;
  installDate: string;
  installCompletedAt?: string;
  status: 'payment_completed' | 'preparing' | 'installing' | 'install_confirmed' | 'settled' | 'disputed';
  createdAt: string;
  updatedAt: string;
}
