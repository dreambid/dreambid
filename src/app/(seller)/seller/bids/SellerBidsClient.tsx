'use client';

import { useState, useMemo } from 'react';
import type { Bid, BidRequest, Order } from '@/types';
import BidListPanel from './BidListPanel';
import BidDetailPanel from './BidDetailPanel';

type TabKey = 'pending' | 'payment_wait' | 'order_wait' | 'shipping' | 'settlement' | 'done';

export type ListItem = {
  id: string;
  bid?: Bid;
  request?: BidRequest;
  order?: Order;
};

const TABS: { key: TabKey; label: string; urgent?: boolean }[] = [
  { key: 'pending',      label: '진행중' },
  { key: 'payment_wait', label: '결제대기' },
  { key: 'order_wait',   label: '발주대기', urgent: true },
  { key: 'shipping',     label: '배송/설치' },
  { key: 'settlement',   label: '정산대기' },
  { key: 'done',         label: '완료·패배' },
];

const BRANDS = ['삼성', 'LG', '캐리어', '위니아'];

interface Props {
  items: { bid: Bid; request?: BidRequest }[];
  orders: Order[];
}

function buildItems(items: Props['items'], orders: Order[], tab: TabKey): ListItem[] {
  const linked = (bidId: string) => {
    const f = items.find(i => i.bid.id === bidId);
    return { bid: f?.bid, request: f?.request };
  };
  switch (tab) {
    case 'pending':
      return items
        .filter(i => i.bid.status === 'pending')
        .map(i => ({ id: i.bid.id, bid: i.bid, request: i.request }));
    case 'payment_wait':
      return items
        .filter(i => i.bid.status === 'selected' && !orders.find(o => o.bidId === i.bid.id))
        .map(i => ({ id: i.bid.id, bid: i.bid, request: i.request }));
    case 'order_wait':
      return orders
        .filter(o => o.status === 'payment_completed')
        .map(o => ({ id: o.id, order: o, ...linked(o.bidId) }));
    case 'shipping':
      return orders
        .filter(o => ['preparing', 'installing'].includes(o.status))
        .map(o => ({ id: o.id, order: o, ...linked(o.bidId) }));
    case 'settlement':
      return orders
        .filter(o => o.status === 'install_confirmed')
        .map(o => ({ id: o.id, order: o, ...linked(o.bidId) }));
    case 'done':
      return [
        ...orders
          .filter(o => o.status === 'settled')
          .map(o => ({ id: o.id, order: o, ...linked(o.bidId) })),
        ...items
          .filter(i => ['failed', 'withdrawn'].includes(i.bid.status))
          .map(i => ({ id: i.bid.id, bid: i.bid, request: i.request })),
      ];
  }
}

function applyFilters(list: ListItem[], query: string, brands: string[]): ListItem[] {
  const kws = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter(item => {
    const models = item.bid?.items.map(bi => bi.modelName) ?? (item.order ? [item.order.modelName] : []);
    if (brands.length > 0 && !brands.some(b => models.some(m => m.includes(b)))) return false;
    if (kws.length === 0) return true;
    const haystack = [
      item.request?.categoryName ?? item.order?.categoryName,
      item.order?.modelName,
      ...models,
      item.request?.deliveryRecipient,
      item.request?.deliveryPhone?.slice(-4),
      item.order?.id,
      item.bid?.id,
    ].filter(Boolean).join(' ').toLowerCase();
    return kws.every(k => haystack.includes(k));
  });
}

export default function SellerBidsClient({ items, orders }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState<string[]>([]);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(t => [t.key, buildItems(items, orders, t.key).length])) as Record<TabKey, number>,
    [items, orders],
  );

  const listItems = useMemo(
    () => applyFilters(buildItems(items, orders, activeTab), query, brands),
    [items, orders, activeTab, query, brands],
  );

  const selected = listItems.find(i => i.id === selectedId) ?? null;

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    setSelectedId(null);
  }

  function toggleBrand(b: string) {
    setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">내 비딩 관리</h1>

      {/* 상태 탭 */}
      <div className="mb-4 flex overflow-x-auto border-b">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-normal ${
              t.urgent && counts[t.key] > 0
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* 검색 + 브랜드 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          placeholder="품목, 고객명, 연락처 뒷자리, 주문번호..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {BRANDS.map(b => (
            <button
              key={b}
              onClick={() => toggleBrand(b)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                brands.includes(b)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* 좌우 스플릿 뷰 */}
      <div className="flex gap-4">
        <div className="w-[360px] shrink-0">
          <BidListPanel items={listItems} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="sticky top-4 min-h-[400px] flex-1 self-start overflow-y-auto rounded-2xl border bg-white" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <BidDetailPanel item={selected} />
        </div>
      </div>
    </div>
  );
}
