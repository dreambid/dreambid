'use client';
// Step1Account — 정산 계좌 섹션 (Step1에서 분리)
import type { FormData } from './SellerRegisterForm';

// 지원 은행 목록
const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행',
  '농협은행', '기업은행', '카카오뱅크', '토스뱅크',
];

// 공통 입력 스타일
const inp = 'w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-gray-400';
const lbl = 'text-xs text-gray-500 block mb-1';
const sm = 'px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white cursor-pointer whitespace-nowrap hover:bg-gray-50 flex-shrink-0';

interface Props {
  data: FormData;
  update: (p: Partial<FormData>) => void;
}

export default function Step1Account({ data, update }: Props) {
  return (
    <div className="border-t border-gray-100 pt-3.5">
      <p className="text-[12px] font-semibold text-gray-500 mb-3">정산 계좌</p>

      {/* 은행 선택 드롭다운 */}
      <div className="mb-3">
        <label className={lbl}>은행 선택 <span className="text-[#E24B4A]">*</span></label>
        <select
          className={`${inp} appearance-none`}
          value={data.bank}
          onChange={e => update({ bank: e.target.value })}
        >
          <option value="">은행을 선택하세요</option>
          {BANKS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 계좌번호 입력 + 예금주 조회 */}
      <div className="mb-3">
        <label className={lbl}>계좌번호 <span className="text-[#E24B4A]">*</span></label>
        <div className="flex gap-2">
          <input
            className={inp}
            placeholder="계좌번호 입력 (-제외)"
            value={data.accountNum}
            onChange={e => update({ accountNum: e.target.value })}
          />
          {/* 예금주 조회 mock */}
          <button className={sm} onClick={() => update({ accountVerified: true })}>조회</button>
        </div>
      </div>

      {/* 조회 완료 시 예금주 표시 */}
      {data.accountVerified && (
        <div className="bg-green-50 rounded-lg px-3 py-2.5 mb-3 flex justify-between items-center">
          <span className="text-[12px] text-gray-500">예금주</span>
          <strong className="text-[13px] text-green-500">✓ 드림가전 (주)</strong>
        </div>
      )}
    </div>
  );
}
