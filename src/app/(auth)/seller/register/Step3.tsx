'use client';
// Step3 — 취급 품목 선택 및 가입 완료 처리
import { useState } from 'react';
import type { FormData } from './SellerRegisterForm';

// 취급 품목 목록 (full: true 항목은 col-span-2 전체 너비)
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
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // 품목 토글 — 복수 선택 허용
  function toggleProduct(id: string) {
    const next = data.products.includes(id)
      ? data.products.filter(p => p !== id)
      : [...data.products, id];
    update({ products: next });
  }

  // 가입 완료 처리 — 최소 1개 선택 검증
  function handleSubmit() {
    if (data.products.length === 0) {
      setError('취급 품목을 최소 1개 선택해주세요.');
      return;
    }
    setError('');
    // TODO: 서버 가입 API 연동
    setDone(true);
  }

  // 가입 완료 화면
  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">🐙</div>
        <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-2">가입 신청 완료!</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          영업일 기준 1~2일 내 검토 후<br />승인 안내 드립니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-500 mb-3">3단계 — 취급 품목</p>

      {/* 취급 품목 선택 그리드 */}
      <label className="text-xs text-gray-500 block mb-2">
        취급 품목 선택 <span className="text-[#E24B4A]">*</span>{' '}
        <span className="text-gray-400 text-[11px]">(복수 선택)</span>
      </label>
      <div className="grid grid-cols-2 gap-1.5 mb-5">
        {PRODUCTS.map(p => (
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

      {/* 검토 기간 안내 박스 */}
      <div className="bg-gray-50 rounded-[10px] p-4 text-center mb-5">
        <div className="text-3xl">⏰</div>
        <h3 className="text-[13px] font-semibold mt-2 mb-1">가입 후 검토까지</h3>
        <p className="text-[12px] text-gray-500">영업일 기준 1~2일 소요됩니다</p>
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-[11px] text-[#E24B4A] mb-2">{error}</p>}

      {/* 이전/가입완료 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-gray-100 text-[#1a1a1a] hover:opacity-85 transition-opacity cursor-pointer"
        >
          ← 이전
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-[#1B4F8A] text-white hover:opacity-85 transition-opacity cursor-pointer"
        >
          가입 완료!
        </button>
      </div>
    </div>
  );
}
