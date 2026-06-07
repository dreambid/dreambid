'use client';
// 판매자 로그인 페이지 — 사업자등록번호 + 비밀번호 입력
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setSellerUser } from '@/lib/auth';

export default function SellerLoginPage() {
  const router = useRouter();
  const [bizNum, setBizNum] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 공통 입력 필드 스타일
  const inpCls =
    'w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-gray-400';

  // 로그인 유효성 검사 및 처리
  function handleLogin() {
    if (!bizNum.trim()) {
      setError('사업자등록번호를 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setSellerUser({ name: '판매자', bizNum: bizNum.trim() });
    router.replace('/seller/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-[340px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {/* 카드 헤더 */}
        <div className="px-6 pt-7 pb-5 border-b border-gray-100 text-center">
          <h1 className="text-lg font-semibold text-[#1a1a1a] mb-0.5">DreamBid Family</h1>
          <p className="text-[12px] text-gray-400">판매자 로그인</p>
        </div>

        <div className="px-6 py-7">
          {/* 사업자등록번호 입력 */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">
              사업자등록번호 <span className="text-[#E24B4A]">*</span>
            </label>
            <input
              className={inpCls}
              placeholder="000-00-00000"
              value={bizNum}
              onChange={e => setBizNum(e.target.value)}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">
              비밀번호 <span className="text-[#E24B4A]">*</span>
            </label>
            <input
              type="password"
              className={inpCls}
              placeholder="비밀번호 입력"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-[11px] text-[#E24B4A] mb-2">{error}</p>}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            className="w-full py-3 text-[14px] font-semibold rounded-[10px] bg-[#1a1a1a] text-white hover:opacity-85 transition-opacity mt-1"
          >
            로그인
          </button>

          {/* 판매자 가입 링크 */}
          <p className="text-[12px] text-gray-400 text-center mt-5">
            계정이 없으신가요?{' '}
            <Link href="/seller/register" className="text-[#1a1a1a] font-semibold underline">
              판매자 가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
