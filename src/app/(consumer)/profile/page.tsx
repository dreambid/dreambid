'use client';

import { useEffect, useState } from 'react';
import { getConsumerUser } from '@/lib/auth';
import type { ConsumerUser } from '@/lib/auth';
import AddressList from '@/components/consumer/AddressList';

export default function ProfilePage() {
  const [user, setUser] = useState<ConsumerUser | null>(null);

  useEffect(() => {
    setUser(getConsumerUser());
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">내 정보</h1>

      {/* User info */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">계정</p>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          {user?.name ?? '로그인 필요'}
        </p>
        {user?.provider && (
          <p className="text-sm text-gray-500">{user.provider} 로그인</p>
        )}
      </div>

      {/* Address management */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">배송지 관리</h2>
        <AddressList />
      </section>
    </div>
  );
}
