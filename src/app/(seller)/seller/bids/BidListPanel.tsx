'use client';

import type { ListItem } from './SellerBidsClient';
import { Badge } from '@/components/shared/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';

const BID_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: '검토중', cls: 'bg-yellow-100 text-yellow-700' },
  selected:  { label: '낙찰',   cls: 'bg-green-100 text-green-700' },
  failed:    { label: '미선택', cls: 'bg-gray-100 text-gray-500' },
  withdrawn: { label: '철회',   cls: 'bg-red-100 text-red-500' },
};

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  payment_completed: { label: '결제완료', cls: 'bg-blue-100 text-blue-700' },
  preparing:         { label: '배송준비', cls: 'bg-yellow-100 text-yellow-700' },
  installing:        { label: '설치중',   cls: 'bg-orange-100 text-orange-700' },
  install_confirmed: { label: '설치확인', cls: 'bg-green-100 text-green-700' },
  settled:           { label: '정산완료', cls: 'bg-gray-100 text-gray-500' },
  disputed:          { label: '분쟁',     cls: 'bg-red-100 text-red-600' },
};

interface Props {
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function isDelayed(item: ListItem): boolean {
  if (!item.order || item.order.status !== 'payment_completed') return false;
  return Date.now() - new Date(item.order.createdAt).getTime() > 24 * 60 * 60 * 1000;
}

export default function BidListPanel({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-white py-12 text-center text-sm text-gray-400">
        해당 항목이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const delayed = isDelayed(item);
        const catName = item.request?.categoryName ?? item.order?.categoryName ?? '알 수 없음';
        const catKey = item.request?.category ?? item.order?.category ?? '';
        const catIcon = CATEGORY_ICONS[catKey] ?? '📦';
        const price = item.bid?.totalPrice ?? item.order?.totalAmount ?? 0;
        const date = item.bid?.createdAt ?? item.order?.createdAt ?? '';
        const statusInfo = item.order
          ? ORDER_STATUS[item.order.status]
          : item.bid
          ? BID_STATUS[item.bid.status]
          : null;
        const modelText = item.bid
          ? item.bid.items.map(bi => bi.modelName).join(', ')
          : item.order?.modelName ?? '';
        const isSelected = item.id === selectedId;

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              isSelected
                ? 'border-blue-400 bg-blue-50'
                : delayed
                ? 'border-red-200 bg-red-50 hover:bg-red-100'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-lg">{catIcon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{catName}</p>
                  <p className="text-xs text-gray-400">{formatDate(date)}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {statusInfo && <Badge label={statusInfo.label} className={statusInfo.cls} />}
                {delayed && <span className="text-[10px] font-medium text-red-500">⚠ 발주지연</span>}
              </div>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="truncate text-xs text-gray-500">{modelText}</p>
              <p className="shrink-0 text-sm font-bold text-green-700">{formatPrice(price)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
