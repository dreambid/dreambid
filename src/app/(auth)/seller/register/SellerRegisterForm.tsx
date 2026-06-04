'use client';
// 판매자 가입 폼 — 단계별 상태 관리 컨트롤러
import { useState } from 'react';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';

// 폼 전체 데이터 타입 정의
export type FormData = {
  bizNum: string;
  bizVerified: boolean;
  ownerConfirmed: boolean;
  shopConfirmed: boolean;
  addressConfirmed: boolean;
  hasExtraAddr: boolean;
  extraAddr: string;
  contactName: string;
  contactPhone: string;
  smsCode: string;
  phoneVerified: boolean;
  storePhone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  bank: string;
  accountNum: string;
  accountVerified: boolean;
  employees: string;
  revenue: string;
  brands: string[];
  products: string[];
};

// 폼 초기값
const INIT: FormData = {
  bizNum: '',
  bizVerified: false,
  ownerConfirmed: false,
  shopConfirmed: false,
  addressConfirmed: false,
  hasExtraAddr: false,
  extraAddr: '',
  contactName: '',
  contactPhone: '',
  smsCode: '',
  phoneVerified: false,
  storePhone: '',
  email: '',
  password: '',
  passwordConfirm: '',
  bank: '',
  accountNum: '',
  accountVerified: false,
  employees: '',
  revenue: '',
  brands: [],
  products: [],
};

// 단계별 헤더 레이블
const STEP_LABELS = ['', '1단계 — 사업자 인증', '2단계 — 규모 정보', '3단계 — 취급 품목'];

export default function SellerRegisterForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INIT);

  // 부분 업데이트 핸들러
  const update = (patch: Partial<FormData>) =>
    setData(prev => ({ ...prev, ...patch }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-[340px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      {/* 카드 헤더 */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 text-center">
        <h1 className="text-lg font-semibold text-[#1a1a1a] mb-0.5">DreamBid Family</h1>
        <p className="text-[12px] text-gray-400">{STEP_LABELS[step]}</p>
      </div>

      <div className="px-6 py-5">
        {/* 단계 인디케이터 */}
        <div className="flex gap-2 justify-center mb-5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-[#1a1a1a]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 단계별 컴포넌트 렌더링 */}
        {step === 1 && (
          <Step1 data={data} update={update} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2
            data={data}
            update={update}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3 data={data} update={update} onPrev={() => setStep(2)} />
        )}
      </div>
    </div>
  );
}
