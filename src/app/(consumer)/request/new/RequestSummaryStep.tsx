'use client';

import type { ProductCategory } from '@/types';
import { Button } from '@/components/shared/Button';
import type { RequestItem } from './NewRequestClient';

interface Props {
  items: RequestItem[];
  categories: ProductCategory[];
  onEdit: (item: RequestItem) => void;
  onDelete: (id: string) => void;
  onAddMore: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function RequestSummaryStep({
  items,
  categories,
  onEdit,
  onDelete,
  onAddMore,
  onSubmit,
  isSubmitting,
}: Props) {
  function getSpecLabel(categoryId: string, stepId: string, value: string) {
    const cat = categories.find((c) => c.id === categoryId);
    return (
      cat?.steps.find((s) => s.id === stepId)?.options.find((o) => o.value === value)?.label ?? value
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">견적 요청 목록</h1>
      <p className="mb-8 text-gray-500">아래 품목에 대해 판매자 견적을 요청합니다</p>

      <div className="mb-8 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.categoryIcon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{item.categoryName}</h3>
                  <p className="text-sm text-gray-500">{item.quantity}대</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(item.specs).map(([stepId, value]) => (
                <span
                  key={stepId}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {getSpecLabel(item.categoryId, stepId, value)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={onAddMore}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          + 품목 추가하기
        </button>
        <Button
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          disabled={items.length === 0}
          onClick={onSubmit}
        >
          견적 요청 완료 ({items.length}개 품목)
        </Button>
      </div>
    </div>
  );
}
