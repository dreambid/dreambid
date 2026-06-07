'use client';

import { useEffect, useState } from 'react';
import { getSellerUser } from '@/lib/auth';
import type { SellerUser } from '@/lib/auth';
import AdForm from '@/components/seller/AdForm';
import AdStatusList from '@/components/seller/AdStatusList';

type View = 'list' | 'form';

export default function SellerAdsPage() {
  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [view, setView] = useState<View>('list');

  useEffect(() => {
    setSeller(getSellerUser());
  }, []);

  if (!seller) {
    return <p className="py-16 text-center text-sm text-gray-400">로그인이 필요합니다.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex px-4">
          {(['list', 'form'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                view === v
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {v === 'list' ? '홍보 현황' : '홍보 등록'}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <AdStatusList sellerId="seller-001" />
      ) : (
        <AdForm
          sellerId="seller-001"
          sellerName={seller.name}
          onSuccess={() => setView('list')}
        />
      )}
    </div>
  );
}
