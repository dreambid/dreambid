'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared/Button';

interface ModelItem {
  modelName: string;
  price: string;
}

interface Props {
  requestId: string;
}

export default function BidSubmitForm({ requestId }: Props) {
  const router = useRouter();
  const [models, setModels] = useState<ModelItem[]>([{ modelName: '', price: '' }]);
  const [installDate, setInstallDate] = useState('');
  const [installFeeIncluded, setInstallFeeIncluded] = useState(true);
  const [collectionService, setCollectionService] = useState<'free' | 'paid' | 'unavailable'>(
    'free'
  );
  const [sellerMessage, setSellerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addModel = () => {
    if (models.length < 3) setModels([...models, { modelName: '', price: '' }]);
  };

  const removeModel = (idx: number) => {
    if (models.length > 1) setModels(models.filter((_, i) => i !== idx));
  };

  const updateModel = (idx: number, field: keyof ModelItem, value: string) => {
    setModels(models.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!installDate || models.some((m) => !m.modelName || !m.price)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          items: models.map((m) => ({ modelName: m.modelName, price: Number(m.price) })),
          installDate,
          installFeeIncluded,
          collectionService,
          sellerMessage,
        }),
      });
      if (res.ok) {
        router.push('/seller/bids');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="font-bold text-gray-900">비딩 작성</h2>

      {/* 모델 입력 (최대 3개) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">제안 모델 (최대 3개)</label>
          {models.length < 3 && (
            <button
              type="button"
              onClick={addModel}
              className="text-sm text-green-600 hover:text-green-700"
            >
              + 모델 추가
            </button>
          )}
        </div>
        {models.map((model, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <div className="flex-1 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">모델명 {idx + 1} *</label>
                <input
                  required
                  value={model.modelName}
                  onChange={(e) => updateModel(idx, 'modelName', e.target.value)}
                  placeholder="예: 삼성 QN65S95CAFXKR"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">견적 금액 (원) *</label>
                <input
                  required
                  type="number"
                  value={model.price}
                  onChange={(e) => updateModel(idx, 'price', e.target.value)}
                  placeholder="1500000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
            {models.length > 1 && (
              <button
                type="button"
                onClick={() => removeModel(idx)}
                className="mt-4 text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 설치 날짜 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">설치 가능 날짜 *</label>
        <input
          required
          type="date"
          value={installDate}
          onChange={(e) => setInstallDate(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* 설치비 포함 여부 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">설치비 포함 여부</label>
        <div className="flex gap-3">
          {[
            { v: true, l: '포함' },
            { v: false, l: '별도' },
          ].map(({ v, l }) => (
            <button
              key={l}
              type="button"
              onClick={() => setInstallFeeIncluded(v)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                installFeeIncluded === v
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 수거 서비스 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          기존 제품 수거 서비스
        </label>
        <div className="flex gap-2">
          {[
            { v: 'free', l: '무료' },
            { v: 'paid', l: '유료' },
            { v: 'unavailable', l: '불가' },
          ].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => setCollectionService(v as 'free' | 'paid' | 'unavailable')}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                collectionService === v
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 판매자 한마디 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          판매자 한마디 (선택)
        </label>
        <textarea
          rows={3}
          value={sellerMessage}
          onChange={(e) => setSellerMessage(e.target.value)}
          placeholder="소비자에게 어필할 내용을 입력하세요 (특가, 서비스 등)"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        비딩 제출하기
      </Button>
    </form>
  );
}
