'use client';
// Step2 — 직원수, 연간 매출, 주취급 브랜드 선택
import { useState } from 'react';
import type { FormData } from './SellerRegisterForm';

// 선택지 상수
const EMPLOYEES = ['1~5명', '6~20명', '21~50명', '51명 이상'];
const REVENUES = ['50억 미만', '50~200억', '200~500억', '500억 이상'];
const BRANDS = ['삼성', 'LG', '캐리어', '기타'];

interface Props {
  data: FormData;
  update: (p: Partial<FormData>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step2({ data, update, onPrev, onNext }: Props) {
  const [error, setError] = useState('');

  // 브랜드 토글 — 최대 2개 제한
  function toggleBrand(b: string) {
    const next = data.brands.includes(b)
      ? data.brands.filter(x => x !== b)
      : data.brands.length >= 2
      ? data.brands
      : [...data.brands, b];
    update({ brands: next });
  }

  // 다음 단계 이동 전 필수값 검증
  function handleNext() {
    if (!data.employees) { setError('직원수를 선택해주세요.'); return; }
    if (!data.revenue) { setError('연간 매출 규모를 선택해주세요.'); return; }
    if (data.brands.length === 0) { setError('주취급 브랜드를 최소 1개 선택해주세요.'); return; }
    setError('');
    onNext();
  }

  // 선택 여부에 따른 옵션 버튼 스타일
  const optCls = (sel: boolean) =>
    `py-2 text-[12px] rounded-lg border cursor-pointer text-center transition-colors ${
      sel ? 'bg-gray-100 border-gray-300 font-semibold' : 'bg-white border-gray-200'
    }`;

  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-500 mb-3">2단계 — 규모 정보</p>

      {/* 직원수 선택 */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1.5">
          직원수 <span className="text-[#E24B4A]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {EMPLOYEES.map(e => (
            <button
              key={e}
              className={optCls(data.employees === e)}
              onClick={() => update({ employees: e })}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* 연간 매출 규모 선택 */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1.5">
          연간 매출 규모 <span className="text-[#E24B4A]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {REVENUES.map(r => (
            <button
              key={r}
              className={optCls(data.revenue === r)}
              onClick={() => update({ revenue: r })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 주취급 브랜드 선택 (최대 2개) */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1.5">
          주취급 브랜드 <span className="text-[#E24B4A]">*</span>{' '}
          <span className="text-gray-400 text-[11px]">(최대 2개)</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {BRANDS.map(b => (
            <button
              key={b}
              className={optCls(data.brands.includes(b))}
              onClick={() => toggleBrand(b)}
            >
              {b}
            </button>
          ))}
        </div>
        {data.brands.length > 0 && (
          <p className="text-[11px] text-gray-500 mt-1">{data.brands.length}개 선택됨</p>
        )}
        {data.brands.length >= 2 && (
          <p className="text-[11px] text-gray-400 mt-0.5">최대 2개까지 선택 가능합니다</p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-[11px] text-[#E24B4A] mb-2">{error}</p>}

      {/* 이전/다음 버튼 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onPrev}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-gray-100 text-[#1a1a1a] hover:opacity-85 transition-opacity cursor-pointer"
        >
          ← 이전
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3 text-[14px] font-semibold rounded-[10px] bg-[#1a1a1a] text-white hover:opacity-85 transition-opacity cursor-pointer"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
