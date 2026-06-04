import type { Metadata } from 'next';
import { SellerHeader } from '@/components/seller/SellerHeader';

export const metadata: Metadata = { title: 'DreamBid Family — 판매자 센터' };

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SellerHeader />
      <main>{children}</main>
    </div>
  );
}
