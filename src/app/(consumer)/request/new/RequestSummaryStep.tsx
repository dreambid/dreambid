'use client';

import type { ProductCategory } from '@/types';
import { Button } from '@/components/shared/Button';
import type { RequestItem, CommonOptions } from './NewRequestClient';

interface Props {
  items: RequestItem[];
  categories: ProductCategory[];
  onEdit: (item: RequestItem) => void;
  onDelete: (id: string) => void;
  onAddMore: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  commonOptions: CommonOptions;
  onCommonOptionsChange: (opts: CommonOptions) => void;
}

const today = new Date().toISOString().split('T')[0];

export default function RequestSummaryStep({
  items, categories, onEdit, onDelete, onAddMore, onSubmit, isSubmitting,
  commonOptions, onCommonOptionsChange,
}: Props) {
  function getSpecLabel(categoryId: string, stepId: string, value: string) {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.steps.find((s) => s.id === stepId)?.options.find((o) => o.value === value)?.label ?? value;
  }

  function set<K extends keyof CommonOptions>(key: K, value: CommonOptions[K]) {
    onCommonOptionsChange({ ...commonOptions, [key]: value });
  }

  const yesNo = (key: 'recyclablePickup' | 'liftRequired', label: string) => (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} onClick={() => set(key, v)}
            className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-colors ${
              commonOptions[key] === v
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {v ? '예' : '아니오'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">견적 요청 목록</h1>
      <p className="mb-8 text-gray-500">아래 품목에 대해 판매자 견적을 요청합니다</p>

      {/* 품목 목록 */}
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
                <button onClick={() => onEdit(item)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600">
                  수정
                </button>
                <button onClick={() => onDelete(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 transition-colors hover:bg-red-50">
                  삭제
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(item.specs).map(([stepId, value]) => (
                <span key={stepId} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {getSpecLabel(item.categoryId, stepId, value)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 배송/설치 공통 옵션 ── */}
      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm space-y-5">
        <h2 className="font-bold text-gray-900">📦 배송/설치 공통 옵션</h2>

        {/* 희망 배송일 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">희망 배송일</label>
          <input type="date" min={today} value={commonOptions.deliveryDate}
            onChange={(e) => set('deliveryDate', e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>

        {yesNo('recyclablePickup', '폐가전 무상수거 필요')}
        {yesNo('liftRequired', '사다리차 지원 필요')}
      </div>

      {/* ── 견적 조건 ── */}
      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm space-y-5">
        <h2 className="font-bold text-gray-900">💰 견적 조건</h2>

        {/* 희망 예산 범위 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            희망 총 예산 범위 <span className="font-normal text-gray-400">(만원 단위)</span>
          </label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" placeholder="최소" value={commonOptions.budgetMin}
              onChange={(e) => set('budgetMin', e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <span className="text-gray-400">~</span>
            <input type="number" min="0" placeholder="최대" value={commonOptions.budgetMax}
              onChange={(e) => set('budgetMax', e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <span className="text-sm text-gray-500 whitespace-nowrap">만원</span>
          </div>
        </div>

        {/* 자유 요청사항 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">추가 요청사항</label>
          <textarea rows={3} placeholder="예: 사은품 요망, 특정 색상 선호, 설치 시 기존 가구 이동 필요 등"
            value={commonOptions.memo}
            onChange={(e) => set('memo', e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="space-y-3">
        <button onClick={onAddMore}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600">
          + 품목 추가하기
        </button>
        <Button className="w-full" size="lg" disabled={items.length === 0} onClick={onSubmit}>
          다음 단계 → ({items.length}개 품목)
        </Button>
      </div>
    </div>
  );
}
