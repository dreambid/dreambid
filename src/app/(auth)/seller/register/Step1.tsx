'use client';
// Step1 — 사업자 인증, 담당자 정보, 비밀번호 입력
import { useState } from 'react';
import type { FormData } from './SellerRegisterForm';
import Step1Account from './Step1Account';

interface Props {
  data: FormData;
  update: (p: Partial<FormData>) => void;
  onNext: () => void;
}

// 재사용 스타일 상수
const lbl = 'text-xs text-gray-500 block mb-1';
const inp = 'w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-gray-400';
const inpAuto = 'w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 bg-gray-50 outline-none';
const sm = 'px-3 py-2 text-[12px] rounded-lg border border-gray-200 bg-white cursor-pointer whitespace-nowrap hover:bg-gray-50 flex-shrink-0';

// 확인 버튼 — confirmed 상태에서 초록색 표시
function ConfirmBtn({
  confirmed,
  onClick,
}: {
  confirmed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${sm} ${confirmed ? 'text-green-500 border-green-500' : ''}`}
      onClick={onClick}
      disabled={confirmed}
    >
      {confirmed ? '✓' : '확인'}
    </button>
  );
}

export default function Step1({ data, update, onNext }: Props) {
  const [showSms, setShowSms] = useState(false);
  const [error, setError] = useState('');

  // 사업자 인증 mock — 실제 API 연동 시 교체
  function verifyBiz() {
    if (!data.bizNum.trim()) {
      setError('사업자등록번호를 입력해주세요.');
      return;
    }
    setError('');
    update({ bizVerified: true });
  }

  // 다음 단계 이동 전 필수값 전체 검증
  function handleNext() {
    if (!data.bizVerified) { setError('사업자 인증을 완료해주세요.'); return; }
    if (!data.ownerConfirmed || !data.shopConfirmed || !data.addressConfirmed) {
      setError('사업자 정보 항목을 모두 확인해주세요.');
      return;
    }
    if (!data.contactName.trim()) { setError('담당자 이름을 입력해주세요.'); return; }
    if (!data.phoneVerified) { setError('휴대폰 인증을 완료해주세요.'); return; }
    if (!data.email.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (data.password.length < 8) { setError('비밀번호는 8자리 이상이어야 합니다.'); return; }
    if (data.password !== data.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!data.bank) { setError('은행을 선택해주세요.'); return; }
    if (!data.accountNum.trim()) { setError('계좌번호를 입력해주세요.'); return; }
    if (!data.accountVerified) { setError('계좌 조회를 완료해주세요.'); return; }
    setError('');
    onNext();
  }

  return (
    <div>
      {/* 사업자등록번호 + 인증 버튼 */}
      <div className="mb-3">
        <label className={lbl}>
          사업자등록번호 <span className="text-[#E24B4A]">*</span>{' '}
          <span className="text-blue-500 text-[11px]">(로그인 아이디)</span>
        </label>
        <div className="flex gap-2">
          <input
            className={inp}
            placeholder="000-00-00000"
            value={data.bizNum}
            onChange={e => update({ bizNum: e.target.value })}
          />
          <button
            className={`${sm} ${data.bizVerified ? 'text-green-500 border-green-500' : ''}`}
            onClick={verifyBiz}
            disabled={data.bizVerified}
          >
            {data.bizVerified ? '✓ 완료' : '인증확인'}
          </button>
        </div>
      </div>

      {/* 인증 완료 후 자동입력 필드 및 나머지 섹션 */}
      {data.bizVerified && (
        <>
          {/* 대표자명 */}
          <div className="mb-3">
            <label className={lbl}>대표자명 <span className="text-[#E24B4A]">*</span></label>
            <div className="flex gap-2 items-center">
              <input className={inpAuto} value="홍길동" readOnly />
              <ConfirmBtn confirmed={data.ownerConfirmed} onClick={() => update({ ownerConfirmed: true })} />
            </div>
          </div>

          {/* 상호명 */}
          <div className="mb-3">
            <label className={lbl}>상호명 <span className="text-[#E24B4A]">*</span></label>
            <div className="flex gap-2 items-center">
              <input className={inpAuto} value="드림가전" readOnly />
              <ConfirmBtn confirmed={data.shopConfirmed} onClick={() => update({ shopConfirmed: true })} />
            </div>
          </div>

          {/* 사업장 주소 */}
          <div className="mb-3">
            <label className={lbl}>사업장 주소 <span className="text-[#E24B4A]">*</span></label>
            <div className="flex gap-2 items-center">
              <input className={inpAuto} value="서울 강남구 테헤란로 123" readOnly />
              <ConfirmBtn confirmed={data.addressConfirmed} onClick={() => update({ addressConfirmed: true })} />
            </div>
          </div>

          {/* 로드뷰 확인 */}
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-[11px] text-gray-500 flex items-center gap-1.5">
            📍 서울 강남구 테헤란로 123{' '}
            <span className="text-green-500">✓ 로드뷰 확인</span>
          </div>

          {/* 추가사업장 토글 */}
          <div className="mb-3">
            <label className={lbl}>
              추가 사업장 <span className="text-[11px] text-gray-400 ml-1">(선택)</span>
            </label>
            <div className="flex gap-2">
              {(['있음', '없음'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => update({ hasExtraAddr: v === '있음' })}
                  className={`flex-1 py-2 text-[12px] rounded-lg border border-gray-200 cursor-pointer ${
                    (v === '있음') === data.hasExtraAddr ? 'bg-gray-100 font-semibold' : 'bg-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {data.hasExtraAddr && (
            <div className="mb-3">
              <label className={lbl}>추가 사업장 주소</label>
              <input
                className={inp}
                placeholder="추가 주소 입력"
                value={data.extraAddr}
                onChange={e => update({ extraAddr: e.target.value })}
              />
            </div>
          )}

          {/* 담당자 정보 섹션 */}
          <div className="border-t border-gray-100 pt-3.5">
            <p className="text-[12px] font-semibold text-gray-500 mb-3">담당자 정보</p>
            <div className="mb-3">
              <label className={lbl}>담당자 이름 <span className="text-[#E24B4A]">*</span></label>
              <input className={inp} placeholder="홍길동" value={data.contactName} onChange={e => update({ contactName: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className={lbl}>담당자 휴대폰 <span className="text-[#E24B4A]">*</span></label>
              <div className="flex gap-2">
                <input className={inp} placeholder="010-0000-0000" value={data.contactPhone} onChange={e => update({ contactPhone: e.target.value })} />
                <button className={sm} onClick={() => setShowSms(true)}>인증번호</button>
              </div>
            </div>
            {showSms && (
              <div className="mb-3">
                <label className={lbl}>인증번호 <span className="text-[#E24B4A]">*</span></label>
                <div className="flex gap-2">
                  <input className={inp} placeholder="6자리 입력" value={data.smsCode} onChange={e => update({ smsCode: e.target.value })} />
                  <button className={sm} onClick={() => update({ phoneVerified: true })}>확인</button>
                </div>
                {data.phoneVerified && <p className="text-[11px] text-green-500 mt-1">✓ 휴대폰 인증 완료</p>}
              </div>
            )}
            <div className="mb-3">
              <label className={lbl}>매장 전화번호 <span className="text-[11px] text-gray-400 ml-1">(선택)</span></label>
              <input className={inp} placeholder="02-0000-0000" value={data.storePhone} onChange={e => update({ storePhone: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className={lbl}>이메일 주소 <span className="text-[#E24B4A]">*</span></label>
              <input type="email" className={inp} placeholder="example@email.com" value={data.email} onChange={e => update({ email: e.target.value })} />
            </div>
          </div>

          {/* 비밀번호 설정 섹션 */}
          <div className="border-t border-gray-100 pt-3.5">
            <p className="text-[12px] font-semibold text-gray-500 mb-3">비밀번호 설정</p>
            <div className="mb-3">
              <label className={lbl}>비밀번호 <span className="text-[#E24B4A]">*</span></label>
              <input type="password" className={inp} placeholder="8자리 이상" value={data.password} onChange={e => update({ password: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className={lbl}>비밀번호 확인 <span className="text-[#E24B4A]">*</span></label>
              <input type="password" className={inp} placeholder="비밀번호 재입력" value={data.passwordConfirm} onChange={e => update({ passwordConfirm: e.target.value })} />
              {data.passwordConfirm && data.password !== data.passwordConfirm && (
                <p className="text-[11px] text-[#E24B4A] mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
          </div>

          {/* 정산 계좌 섹션 (분리된 컴포넌트) */}
          <Step1Account data={data} update={update} />

          <p className="text-[11px] text-gray-400 mb-2 mt-1">
            <span className="text-[#E24B4A]">*</span> 필수 입력 항목
          </p>
        </>
      )}

      {/* 에러 메시지 */}
      {error && <p className="text-[11px] text-[#E24B4A] mb-2">{error}</p>}

      {/* 다음 단계 이동 버튼 */}
      <button
        onClick={handleNext}
        className="w-full py-3 text-[14px] font-semibold rounded-[10px] bg-[#1a1a1a] text-white hover:opacity-85 transition-opacity mt-1"
      >
        다음 →
      </button>
    </div>
  );
}
