'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData } from '@/types';
import type { Ad } from '@/types/ad';
import type { AddressInput } from '@/types/address';
import { isConsumerLoggedIn } from '@/lib/auth';
import CategorySelectStep from './CategorySelectStep';
import CategoryConditionStep from './CategoryConditionStep';
import RequestSummaryStep from './RequestSummaryStep';
import RequestDeliveryStep from './RequestDeliveryStep';

export interface RequestItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  specs: Record<string, string>;
  quantity: number;
}

export interface CommonOptions {
  deliveryDate: string;       // 희망 배송일 ('' = 빠를수록 좋아요)
  recyclablePickup: boolean;  // 폐가전 무상수거
  liftRequired: boolean;      // 사다리차 지원 필요
  memo: string;               // 자유 추가 요청사항
}

const DEFAULT_OPTIONS: CommonOptions = {
  deliveryDate: '',
  recyclablePickup: false,
  liftRequired: false,
  memo: '',
};

interface Props { productData: ProductData; activeAds: Ad[]; }

type Phase = 'select' | 'input' | 'summary' | 'delivery';

export default function NewRequestClient({ productData, activeAds }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [currentCatId, setCurrentCatId] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commonOptions, setCommonOptions] = useState<CommonOptions>(DEFAULT_OPTIONS);
  const [deliveryInfo, setDeliveryInfo] = useState<AddressInput | null>(null);

  useEffect(() => {
    if (!isConsumerLoggedIn()) {
      router.replace('/consumer/login?from=/request/new');
    }
  }, [router]);

  const categories = productData.categories;
  const currentCategory = categories.find((c) => c.id === currentCatId) ?? null;
  const currentIndex = total - queue.length;

  function startInput(ids: string[]) {
    const [first, ...rest] = ids;
    setTotal(ids.length);
    setQueue(rest);
    setCurrentCatId(first);
    setInputKey((k) => k + 1);
    setPhase('input');
  }

  function advanceQueue() {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentCatId(next);
      setQueue(rest);
      setInputKey((k) => k + 1);
    } else {
      setPhase('summary');
    }
  }

  function handleItemDone(item: Omit<RequestItem, 'id'>, addAnother: boolean) {
    const newItem: RequestItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setItems((prev) => [...prev, newItem]);
    if (addAnother) {
      setInputKey((k) => k + 1); // 같은 카테고리, 새 입력 강제 리마운트
    } else {
      advanceQueue();
    }
  }

  function handleEdit(item: RequestItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setTotal(1);
    setQueue([]);
    setCurrentCatId(item.categoryId);
    setInputKey((k) => k + 1);
    setPhase('input');
  }

  async function handleSubmit(delivery: AddressInput | null = deliveryInfo) {
    setIsSubmitting(true);
    try {
      for (const item of items) {
        await fetch('/api/bid-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: item.categoryId,
            specs: item.specs,
            quantity: item.quantity,
            ...commonOptions,
            ...(delivery && {
              deliveryRecipient: delivery.recipient,
              deliveryPhone: delivery.phone,
              deliveryZipCode: delivery.zipCode,
              deliveryAddress: delivery.address,
              deliveryAddressDetail: delivery.addressDetail,
              deliveryLabel: delivery.label,
            }),
          }),
        });
      }
      router.push('/requests');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (phase === 'select') {
    return (
      <CategorySelectStep
        categories={categories}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onNext={(ids) => { setSelectedIds(ids); startInput(ids); }}
      />
    );
  }

  if (phase === 'input' && currentCategory) {
    return (
      <CategoryConditionStep
        key={inputKey}
        category={currentCategory}
        helpTexts={productData.helpTexts}
        currentIndex={currentIndex}
        total={total}
        onDone={handleItemDone}
        onBack={() => { setPhase('select'); }}
        activeAds={activeAds}
      />
    );
  }

  if (phase === 'delivery') {
    return (
      <RequestDeliveryStep
        initial={deliveryInfo}
        onBack={() => setPhase('summary')}
        onNext={(addr) => { setDeliveryInfo(addr); handleSubmit(addr); }}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <RequestSummaryStep
      items={items}
      categories={categories}
      onEdit={handleEdit}
      onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
      onAddMore={() => { setSelectedIds([]); setPhase('select'); }}
      onSubmit={() => setPhase('delivery')}
      isSubmitting={false}
      commonOptions={commonOptions}
      onCommonOptionsChange={setCommonOptions}
    />
  );
}
