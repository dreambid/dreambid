'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductData, ProductCategory } from '@/types';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';

interface Props { productData: ProductData; }

export default function NewRequestClient({ productData }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'category' | 'steps' | 'model'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [modelName, setModelName] = useState('');
  const [helpModal, setHelpModal] = useState<{ open: boolean; key: string; option: string }>({
    open: false,
    key: '',
    option: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리 선택 화면
  if (phase === 'category') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">어떤 가전을 찾으세요?</h1>
        <p className="mb-8 text-gray-500">품목을 선택하면 최적 조건 입력을 도와드립니다</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {productData.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat);
                setPhase('steps');
                setCurrentStep(0);
                setAnswers({});
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-blue-400 hover:shadow-md"
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="font-semibold text-gray-800">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCategory) return null;
  const steps = selectedCategory.steps;
  const totalSteps = steps.length + 1; // +1 모델명 입력 단계

  // 단계별 질문 화면
  if (phase === 'steps') {
    const step = steps[currentStep];
    const selectedValue = answers[step.id];
    const progress = Math.round((currentStep / totalSteps) * 100);
    const helpText = step.helpKey ? productData.helpTexts[step.helpKey] : null;

    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* 진행 표시 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
            <span>
              {selectedCategory.icon} {selectedCategory.name}
            </span>
            <span>
              {currentStep + 1} / {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="mb-6 text-xl font-bold text-gray-900">{step.question}</h2>

        <div className="space-y-3">
          {step.options.map((opt) => {
            const hasHelp = helpText && helpText[opt.value];
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
          <Button
            variant="ghost"
            onClick={() => {
              if (currentStep === 0) {
                setPhase('category');
              } else {
                setCurrentStep((s) => s - 1);
              }
            }}
          >
            이전
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedValue}
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep((s) => s + 1);
              } else {
                setPhase('model');
              }
            }}
          >
            다음
          </Button>
        </div>

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
                    {steps
                      .find((s) => s.helpKey === helpModal.key)
                      ?.options.find((o) => o.value === key)?.label ?? key}
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

  // 모델명 입력 단계 (선택사항)
  const progress = Math.round(((totalSteps - 1) / totalSteps) * 100);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bid-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory!.id,
          specs: answers,
          modelName: modelName.trim(),
        }),
      });
      if (res.ok) {
        router.push('/requests');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>
            {selectedCategory.icon} {selectedCategory.name}
          </span>
          <span>
            {totalSteps} / {totalSteps}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="mb-2 text-xl font-bold text-gray-900">원하시는 모델이 있으신가요?</h2>
      <p className="mb-6 text-sm text-gray-500">
        모르셔도 괜찮습니다. 판매자들이 최적 모델을 제안합니다.
      </p>

      <input
        type="text"
        placeholder="예: 삼성 QN65S95CAFXKR (선택사항)"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="mt-8 flex gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            setPhase('steps');
            setCurrentStep(steps.length - 1);
          }}
        >
          이전
        </Button>
        <Button className="flex-1" isLoading={isSubmitting} onClick={handleSubmit}>
          비딩 요청 완료
        </Button>
      </div>
    </div>
  );
}
