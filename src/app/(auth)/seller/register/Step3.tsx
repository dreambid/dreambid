'use client';
// Step3 — 취급 품목 선택 및 가입 완료 처리
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormData } from './SellerRegisterForm';

const PRODUCTS = [
  { id: 'tv', label: '📺 TV', full: false },
  { id: 'fridge', label: '🧊 냉장고', full: false },
  { id: 'ac', label: '❄️ 에어컨', full: false },
  { id: 'washer', label: '🫧 세탁기', full: false },
  { id: 'styler', label: '👔 의류관리기', full: true },
];

interface Props {
  data: FormData;
  update: (p: Partial<FormData>) => void;
  onPrev: () => void;
}

export default function Step3({ data, update, onPrev }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleProduct(id: string) {
    const next = data.products.includes(id)
      ? data.products.filter((p) => p !== id)
      : [...data.products, id];
    update({ products: next });
  }

  async function handleSubmit() {
    if (data.products.length === 0) {
      setError('취급 품목을 최소 1개 선택해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/seller/login'), 2500);
      } else {
        setError('가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">🐙</div>
        <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-2">가입 신청 완료!</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          영업일 기준 1~2일 내 검토 후<br />승인 안내 드립니다.
        </p>
        <p className="text-[11px] text-gray-400 mt-3">로그인 페이지로 이동 중...</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-500 mb-3">3단계 — 취급 품목</p>

      <label className="text-xs text-gray-500 block mb-2">
        취급 품목 선택 <span className="text-[#E24B4A]">*</span>{' '}
        <span className="text-gray-400 text-[11px]">(복수 선택)</span>
      </label>
      <div className="grid grid-cols-2 gap-1.5 mb-5">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => toggleProduct(p.id)}
            className={`py-2.5 px-2 text-[12px] rounded-lg border cursor-pointer text-center transition-colors ${
              p.full ? 'col-span-2' : ''
            } ${
              data.products.includes(p.id)
                ? 'bg-gray-100 border-gray-300 font-semibold'
                : 'bg-white border-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-[10px] p-4 text-center mb-5">
        <div className="text-3xl">⏰</div>
        <h3 className="text-[13px] font-semibold mt-2 mb-1">가입 후 검토까지</h3>
        <p className="text-[12px] text-gray-500">영업일 기준 1~2일 소요됩니다</p>
      </div>

      {error && <p className="text-[11px] text-[#E24B4A] mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={submitting}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-gray-100 text-[#1a1a1a] hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
        >
          ← 이전
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-[#1B4F8A] text-white hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {submitting ? '처리 중...' : '가입 완료!'}
        </button>
      </div>
    </div>
  );
}
