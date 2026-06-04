import { readData } from '@/lib/data';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';

const MY_SELLER_ID = 'seller-001';

const orderStatusLabel: Record<string, string> = {
  payment_completed: '결제완료',
  preparing: '배송준비',
  installing: '설치중',
  install_confirmed: '설치확인',
  settled: '정산완료',
  disputed: '분쟁',
};

const orderStatusColor: Record<string, string> = {
  payment_completed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  installing: 'bg-orange-100 text-orange-700',
  install_confirmed: 'bg-green-100 text-green-700',
  settled: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-100 text-red-600',
};

export default function SellerOrdersPage() {
  const orders = readData<Order>('orders.json').filter((o) => o.sellerId === MY_SELLER_ID);
  const totalRevenue = orders
    .filter((o) => o.status === 'settled')
    .reduce((s, o) => s + o.sellerAmount, 0);
  const pending = orders.filter((o) => !['settled', 'disputed'].includes(o.status)).length;
  const settledCount = orders.filter((o) => o.status === 'settled').length;
  const defaultCommissionRate = orders[0]?.commissionRate ?? 0.02;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">거래 / 정산 현황</h1>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">진행중 거래</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{pending}건</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">정산 완료</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{settledCount}건</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">총 수령액</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* 거래 목록 */}
      {orders.length === 0 ? (
        <div className="py-12 text-center text-gray-400">완료된 거래가 없습니다</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">품목/모델</th>
                <th className="px-4 py-3 text-right">결제금액</th>
                <th className="px-4 py-3 text-right">수령예정액</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">설치일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.categoryName}</p>
                    <p className="text-xs text-gray-400">{order.modelName}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    {formatPrice(order.sellerAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      label={orderStatusLabel[order.status] ?? order.status}
                      className={orderStatusColor[order.status] ?? 'bg-gray-100 text-gray-600'}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{order.installDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        * 수령액 = 결제금액 - 수수료({defaultCommissionRate * 100}%). 설치 완료 확인 후 자동
        정산됩니다.
      </p>
    </div>
  );
}
