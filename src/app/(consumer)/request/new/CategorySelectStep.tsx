'use client';

import { cn } from '@/lib/utils';
import type { ProductCategory } from '@/types';

interface Props {
  categories: ProductCategory[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNext: (ids: string[]) => void;
}

export default function CategorySelectStep({
  categories,
  selectedIds,
  onSelectionChange,
  onNext,
}: Props) {
  function toggle(id: string) {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">필요한 가전을 모두 선택하세요</h1>
      <p className="mb-8 text-gray-500">여러 품목을 한 번에 견적 요청할 수 있습니다</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((cat) => {
          const selected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={cn(
                'relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-white p-6 text-center transition-all',
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md',
              )}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  ✓
                </span>
              )}
              <span className="text-4xl">{cat.icon}</span>
              <span className={cn('font-semibold', selected ? 'text-blue-700' : 'text-gray-800')}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <button
          onClick={() => onNext(selectedIds)}
          disabled={selectedIds.length === 0}
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          다음 단계{selectedIds.length > 0 ? ` (${selectedIds.length}개 선택)` : ''}
        </button>
      </div>
    </div>
  );
}
