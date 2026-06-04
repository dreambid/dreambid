'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProductCategory, HelpText } from '@/types';

interface StepFormProps {
  category: ProductCategory;
  helpTexts: Record<string, HelpText>;
  onComplete: (specs: Record<string, string>, modelName: string) => void;
  onBack: () => void;
}

/* 단계별 스펙 선택 폼 */
export function StepForm({ category, helpTexts, onComplete, onBack }: StepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [modelName, setModelName] = useState('');
  const [helpOpen, setHelpOpen] = useState<string | null>(null);

  const steps = category.steps;
  const isLastStep = currentStep === steps.length;
  const step = steps[currentStep];

  const handleSelect = (value: string) => {
    setSelections((prev) => ({ ...prev, [step.id]: value }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(selections, modelName);
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      onBack();
      return;
    }
    setCurrentStep((s) => s - 1);
  };

  const canProceed = isLastStep || !!selections[step?.id];
  const totalSteps = steps.length + (category.hasModelInput ? 1 : 0);

  return (
    <div>
      {/* 진행 표시바 */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-gray-500">
          <span>{category.name} 조건 입력</span>
          <span>Step {Math.min(currentStep + 1, totalSteps)} / {totalSteps}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* 스텝 질문 */}
      {!isLastStep && step && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">{step.question}</h3>
            {step.helpKey && helpTexts[step.helpKey] && (
              <button
                onClick={() => setHelpOpen(helpOpen === step.id ? null : step.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-50"
              >
                ?
              </button>
            )}
          </div>

          {/* 도움말 팝업 */}
          {helpOpen === step.id && step.helpKey && helpTexts[step.helpKey] && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
              {Object.entries(helpTexts[step.helpKey]).map(([key, desc]) => (
                <div key={key} className="mb-2 last:mb-0">
                  <span className="font-medium text-blue-800">{key.toUpperCase()}: </span>
                  <span className="text-sm text-blue-700">{desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* 옵션 선택 */}
          <div className="grid grid-cols-2 gap-3">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'rounded-xl border-2 p-4 text-left transition-all',
                  selections[step.id] === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-blue-200'
                )}
              >
                <span className={cn('font-medium', selections[step.id] === opt.value ? 'text-blue-700' : 'text-gray-800')}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 모델명 입력 */}
      {isLastStep && category.hasModelInput && (
        <div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">원하는 모델명이 있으신가요? (선택)</h3>
          <p className="mb-4 text-sm text-gray-500">없으면 비워두세요. 판매자가 조건에 맞는 모델을 추천해드립니다.</p>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="예: 삼성 QN65S95C"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* 이전 / 다음 버튼 */}
      <div className="mt-8 flex gap-3">
        <button onClick={handlePrev} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          {isLastStep ? '요청 완료' : '다음'}
        </button>
      </div>
    </div>
  );
}
