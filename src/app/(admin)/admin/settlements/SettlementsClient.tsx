'use client';

import { useState } from 'react';
import type { Order } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckCircle, RotateCcw } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  payment_completed: '결제완료',
  preparing: '준비중',
  installing: '설치중',
  install_confirmed: '설치확인',
  settled: '정산완료',
  disputed: '분쟁중',
};
const STATUS_COLORS: Record<string, string> = {
  payment_completed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-700',
  installing: 'bg-purple-100 text-purple-700',
  install_confirmed: 'bg-green-100 text-green-700',
  settled: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-100 text-red-700',
};

export default function SettlementsClient({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [loading, setLoading] = useState('');

  const releaseEscrow = async (id: string) => {
    setLoading(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowStatus: 'released', status: 'settled' }),
    });
    if (res.ok) {
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
    setLoading('');
  };

  const refundEscrow = async (id: string) => {
    setLoading(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowStatus: 'refunded', status: 'disputed' }),
    });
    if (res.ok) {
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
    setLoading('');
  };

  const totalHeld = orders.filter((o) => o.escrowStatus === 'held').reduce((s, o) => s + o.totalAmount, 0);
  const totalReleased = orders.filter((o) => o.escrowStatus === 'released').reduce((s, o) => s + o.sellerAmount, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commissionAmount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '에스크로 보관중', value: formatPrice(totalHeld), color: 'text-amber-600' },
          { label: '판매자 지급 완료', value: formatPrice(totalReleased), color: 'text-green-600' },
          { label: '누적 수수료 수입', value: formatPrice(totalCommission), color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500">
              <th className="text-left px-4 py-3 font-medium">주문 ID</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-left px-4 py-3 font-medium">상품</th>
              <th className="text-right px-4 py-3 font-medium">거래금액</th>
              <th className="text-right px-4 py-3 font-medium">수수료(2%)</th>
              <th className="text-right px-4 py-3 font-medium">판매자 지급액</th>
              <th className="text-center px-4 py-3 font-medium">에스크로</th>
              <th className="text-center px-4 py-3 font-medium">주문상태</th>
              <th className="text-center px-4 py-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{o.id}</td>
                <td className="px-4 py-3.5 text-gray-700">{o.categoryName}</td>
                <td className="px-4 py-3.5">
                  <p className="text-gray-800 text-xs">{o.modelName}</p>
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-900">{formatPrice(o.totalAmount)}</td>
                <td className="px-4 py-3.5 text-right text-blue-600">{formatPrice(o.commissionAmount)}</td>
                <td className="px-4 py-3.5 text-right text-green-700 font-medium">{formatPrice(o.sellerAmount)}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    o.escrowStatus === 'held' ? 'bg-amber-100 text-amber-700' :
                    o.escrowStatus === 'released' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {o.escrowStatus === 'held' ? '보관중' : o.escrowStatus === 'released' ? '지급완료' : '환불됨'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500')}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  {o.escrowStatus === 'held' && (
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        disabled={loading === o.id}
                        onClick={() => releaseEscrow(o.id)}
                        title="정산 지급"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        disabled={loading === o.id}
                        onClick={() => refundEscrow(o.id)}
                        title="환불 처리"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">주문이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
