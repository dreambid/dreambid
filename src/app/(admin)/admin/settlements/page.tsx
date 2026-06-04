import { readData } from '@/lib/data';
import type { Order } from '@/types/product';
import SettlementsClient from './SettlementsClient';

export default function AdminSettlementsPage() {
  const orders = readData<Order>('orders.json');
  const heldCount = orders.filter((o) => o.escrowStatus === 'held').length;
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          총 주문 {orders.length}건 · 에스크로 보관중 {heldCount}건
        </p>
      </div>
      <SettlementsClient orders={orders} />
    </div>
  );
}
