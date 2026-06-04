import { readData } from '@/lib/data';
import type { Seller } from '@/types/seller';
import SellersClient from './SellersClient';

export default function AdminSellersPage() {
  const sellers = readData<Seller>('sellers.json');
  const pendingCount = sellers.filter((s) => s.status === 'pending').length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">판매자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {sellers.length}명 · 승인 대기 {pendingCount}명
        </p>
      </div>
      <SellersClient sellers={sellers} />
    </div>
  );
}
