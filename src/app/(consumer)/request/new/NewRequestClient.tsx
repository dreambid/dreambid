'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData } from '@/types';
import { isConsumerLoggedIn } from '@/lib/auth';
import CategorySelectStep from './CategorySelectStep';
import CategoryConditionStep from './CategoryConditionStep';
import RequestSummaryStep from './RequestSummaryStep';

export interface RequestItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  specs: Record<string, string>;
  quantity: number;
}

interface Props { productData: ProductData; }

type Phase = 'select' | 'input' | 'summary';

export default function NewRequestClient({ productData }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [currentCatId, setCurrentCatId] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit() {
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
        onBack={() => { setSelectedIds([]); setPhase('select'); }}
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
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
