'use client';

import { cn } from '@/lib/utils';
import type { ProductCategory } from '@/types';

interface CategorySelectProps {
  categories: ProductCategory[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}

/* 품목 카테고리 선택 그리드 */
export function CategorySelect({ categories, selectedId, onSelect }: CategorySelectProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">어떤 가전을 원하세요?</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all hover:shadow-md',
              selectedId === cat.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-100 bg-white hover:border-blue-200'
            )}
          >
            <span className="text-4xl">{cat.icon}</span>
            <span className={cn('text-sm font-medium', selectedId === cat.id ? 'text-blue-700' : 'text-gray-700')}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
