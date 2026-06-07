'use client';

import { useState } from 'react';
import type { ProductCategory } from '@/types';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import type { RequestItem } from './NewRequestClient';
import CategoryAdBanner from './CategoryAdBanner';
import type { Ad } from '@/types/ad';

interface Props {
  category: ProductCategory;
  helpTexts: Record<string, Record<string, string>>;
  currentIndex: number;
  total: number;
  onDone: (item: Omit<RequestItem, 'id'>, addAnother: boolean) => void;
  onBack: () => void;
  activeAds: Ad[];
}

export default function CategoryConditionStep({
  category,
  helpTexts,
  currentIndex,
  total,
  onDone,
  onBack,
  activeAds,
}: Props) {
  const [subPhase, setSubPhase] = useState<'steps' | 'quantity'>('steps');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [helpModal, setHelpModal] = useState({ open: false, key: '', option: '' });

  const { steps } = category;
  const totalInternal = steps.length + 1; // 마지막은 수량 입력
  const internalStep = subPhase === 'steps' ? stepIndex : steps.length;
  const progress = Math.round((internalStep / totalInternal) * 100);

  const step = steps[stepIndex];
  const helpText = step?.helpKey ? helpTexts[step.helpKey] : null;
  const selectedValue = step ? (answers[step.id] ?? '') : '';

  function goNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setSubPhase('quantity');
    }
  }

  function goPrev() {
    if (subPhase === 'quantity') {
      setSubPhase('steps');
    } else if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      onBack();
    }
  }

  function finish(addAnother: boolean) {
    onDone(
      {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        specs: answers,
        quantity,
      },
      addAnother,
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* 진행 표시 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {category.icon} {category.name}
            <span className="ml-2 font-normal text-gray-400">({currentIndex} / {total})</span>
          </span>
          <span className="text-gray-500">{internalStep + 1} / {totalInternal}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 단계별 질문 */}
      {subPhase === 'steps' && step && (
        <>
          <h2 className="mb-6 text-xl font-bold text-gray-900">{step.question}</h2>
          <div className="space-y-3">
            {step.options.map((opt) => {
              const hasHelp = helpText?.[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((prev) => ({ ...prev, [step.id]: opt.value }))}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all ${
                    selectedValue === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {hasHelp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHelpModal({ open: true, key: step.helpKey!, option: opt.value });
                      }}
                      className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs text-gray-600 hover:bg-gray-400"
                    >
                      ?
                    </button>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={goPrev}>이전</Button>
            <Button className="flex-1" disabled={!selectedValue} onClick={goNext}>다음</Button>
          </div>
        </>
      )}

      {/* 수량 입력 */}
      {subPhase === 'quantity' && (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">같은 사양으로 몇 대 필요하세요?</h2>
          <p className="mb-8 text-sm text-gray-500">수량을 선택하면 동일한 조건으로 견적을 받습니다</p>
          <div className="flex items-center justify-center gap-8 rounded-2xl border bg-white p-8 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-2xl text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              −
            </button>
            <span className="w-16 text-center text-4xl font-bold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-2xl text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              +
            </button>
          </div>
          <CategoryAdBanner activeAds={activeAds} categoryId={category.id} />
          <div className="mt-8 space-y-3">
            <Button className="w-full" onClick={() => finish(false)}>
              {currentIndex >= total ? '입력 완료' : '다음 품목으로 →'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => finish(true)}>
              + 다른 사양도 추가
            </Button>
            <Button variant="ghost" className="w-full" onClick={goPrev}>이전</Button>
          </div>
        </>
      )}

      {/* 도움말 모달 */}
      {helpModal.open && helpText && (
        <Modal
          isOpen
          title="선택 가이드"
          onClose={() => setHelpModal({ open: false, key: '', option: '' })}
        >
          <div className="space-y-3">
            {Object.entries(helpText).map(([key, text]) => (
              <div
                key={key}
                className={`rounded-lg p-3 ${
                  key === helpModal.option ? 'bg-blue-50 ring-1 ring-blue-300' : 'bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-800">
                  {steps.find((s) => s.helpKey === helpModal.key)?.options.find((o) => o.value === key)?.label ?? key}
                </p>
                <p className="mt-1 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
