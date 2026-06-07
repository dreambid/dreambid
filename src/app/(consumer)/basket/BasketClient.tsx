'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BasketItem, Bid } from '@/types';
import { formatPrice } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import { Button } from '@/components/shared/Button';
import { isConsumerLoggedIn } from '@/lib/auth';
import CheckoutFlow from './CheckoutFlow';

interface Props {
  items: Array<{ basketItem: BasketItem; bid: Bid }>;
}

export default function BasketClient({ items: initialItems }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'view' | 'checkout'>('view');
  const [localItems, setLocalItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!isConsumerLoggedIn()) {
      router.replace('/consumer/login?from=/basket');
    }
  }, [router]);

  async function removeItem(basketItemId: string) {
    setRemoving(basketItemId);
    try {
      await fetch(`/api/basket/${basketItemId}`, { method: 'DELETE' });
      setLocalItems((prev) => prev.filter((i) => i.basketItem.id !== basketItemId));
    } finally {
      setRemoving(null);
    }
  }

  if (phase === 'checkout') {
    return (
      <CheckoutFlow
        items={localItems}
        onBack={() => setPhase('view')}
        onComplete={() => router.push('/requests')}
      />
    );
  }

  const grouped = localItems.reduce<Record<string, typeof localItems>>((acc, item) => {
    const key = item.basketItem.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const total = localItems.reduce((sum, i) => sum + i.bid.totalPrice, 0);

  if (localItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-5xl">🛒</p>
        <p className="mb-2 text-xl font-semibold text-gray-700">비딩 바구니가 비어있습니다</p>
        <p className="mb-6 text-gray-500">마음에 드는 비딩을 담아보세요</p>
        <Link href="/requests"><Button>내 비딩 요청 보기</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">비딩 바구니</h1>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, groupItems]) => (
          <div key={category} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
              <span className="text-xl">{CATEGORY_ICONS[category]}</span>
              {groupItems[0].basketItem.categoryName}
            </h2>
            {groupItems.map(({ basketItem, bid }) => (
              <div key={basketItem.id} className="mb-3 flex items-start justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="font-medium text-gray-900">{bid.sellerName}</p>
                  <p className="text-sm text-gray-500">{bid.items[0]?.modelName}</p>
                  <p className="text-xs text-gray-400">
                    설치: {bid.installDate} · 설치비 {bid.installFeeIncluded ? '포함' : '별도'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">{formatPrice(bid.totalPrice)}</p>
                  <button
                    onClick={() => removeItem(basketItem.id)}
                    disabled={removing === basketItem.id}
                    className="mt-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {removing === basketItem.id ? '제거 중...' : '제거'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-gray-600">총 합계</span>
          <span className="text-2xl font-bold text-blue-700">{formatPrice(total)}</span>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          에스크로 결제 방식 — 설치 완료 확인 후 판매자에게 정산됩니다
        </p>
        <Button className="w-full" size="lg" onClick={() => setPhase('checkout')}>
          요청하기
        </Button>
      </div>
    </div>
  );
}
