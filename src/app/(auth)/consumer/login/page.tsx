'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setConsumerUser } from '@/lib/auth';
import { setConsumerCookie } from '@/lib/session';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/requests';

  function handleLogin(provider: 'kakao' | 'naver' | 'google' | 'apple', name: string) {
    setConsumerUser({ name, provider });
    setConsumerCookie({ consumerId: 'consumer-001', name, provider });
    router.replace(from);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-[340px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      {/* 카드 헤더 */}
      <div className="px-6 pt-7 pb-5 border-b border-gray-100 text-center">
        <Link href="/custom" className="inline-block">
          <h1 className="text-[22px] font-semibold text-[#1a1a1a] mb-1">로그인 / 회원가입</h1>
        </Link>
        <p className="text-[13px] text-gray-400">처음이신가요? 버튼 하나로 즉시 시작!</p>
      </div>

      {/* 소셜 로그인 버튼 목록 */}
      <div className="px-6 py-7">
        <p className="text-[15px] font-semibold text-center text-[#1a1a1a] mb-5">기존 회원은 자동 로그인됩니다</p>

        {/* 카카오 로그인 */}
        <button
          onClick={() => handleLogin('kakao', '카카오 사용자')}
          className="w-full flex items-center justify-center gap-2 px-4 py-[13px] rounded-[10px] text-[15px] font-medium bg-[#FEE500] text-[#3C1E1E] border border-[#FEE500] hover:opacity-85 transition-opacity mb-[10px]"
        >
          <span className="text-lg">💬</span> 카카오로 시작하기
        </button>

        {/* 네이버 로그인 */}
        <button
          onClick={() => handleLogin('naver', '네이버 사용자')}
          className="w-full flex items-center justify-center gap-2 px-4 py-[13px] rounded-[10px] text-[15px] font-medium bg-[#03C75A] text-white border border-[#03C75A] hover:opacity-85 transition-opacity mb-[10px]"
        >
          <span className="text-lg">🍃</span> 네이버로 시작하기
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={() => handleLogin('google', '구글 사용자')}
          className="w-full flex items-center justify-center gap-2 px-4 py-[13px] rounded-[10px] text-[15px] font-medium bg-white text-[#1a1a1a] border border-gray-200 hover:opacity-85 transition-opacity mb-[10px]"
        >
          <span className="text-lg">🔍</span> 구글로 시작하기
        </button>

        {/* 애플 로그인 */}
        <button
          onClick={() => handleLogin('apple', '애플 사용자')}
          className="w-full flex items-center justify-center gap-2 px-4 py-[13px] rounded-[10px] text-[15px] font-medium bg-white text-[#1a1a1a] border border-gray-200 hover:opacity-85 transition-opacity mb-[10px]"
        >
          <span className="text-lg">🍎</span> 애플로 시작하기
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
          가입 즉시 서비스 이용 가능<br />추가 입력 없음
        </p>
      </div>

      <div className="pb-6 text-center">
        <Link href="/custom" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function ConsumerLoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
