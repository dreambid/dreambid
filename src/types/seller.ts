export type SellerStatus = 'pending' | 'approved' | 'suspended' | 'withdrawn';
export type EmployeesRange = '1-5' | '6-20' | '21-50' | '51+';
export type SalesRange = 'under-50b' | '50-200b' | '200-500b' | '500b+';

export interface Seller {
  id: string;
  bizNumber: string;
  companyName: string;
  ceoName: string;
  address: string;
  extraAddress?: string;
  managerName: string;
  managerPhone: string;
  storePhone?: string;
  email: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  employeesRange: EmployeesRange;
  salesRange: SalesRange;
  brands: string[];
  productCategories: string[];
  status: SellerStatus;
  rating: number;
  reviewCount: number;
  totalBids: number;
  acceptedBids: number;
  totalRevenue: number;
  warningCount: number;
  verifiedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
