export type UserStatus = 'active' | 'suspended';

export interface Consumer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: 'kakao' | 'naver' | 'google' | 'apple';
  status: UserStatus;
  address?: string;
  totalRequests: number;
  completedDeals: number;
  createdAt: string;
  updatedAt: string;
}
