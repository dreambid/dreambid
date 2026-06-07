'use client';

import { useState } from 'react';
import type { BasketItem, Bid } from '@/types';
import type { Address, DeliveryConfig } from '@/types/address';
import { getAddresses } from '@/lib/addressStorage';
import { CATEGORY_ICONS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import DeliveryItemCard from '@/components/consumer/DeliveryItemCard';

interface Props {
  items: Array<{ basketItem: BasketItem; bid: Bid }>;
  onBack: () => void;
  onComplete: () => void;
}

type Phase = 'delivery' | 'confirm';

const CONTACT_TIME_LABELS: Record<string, string> = {
  morning: '오전 (09-12)',
  afternoon: '오후 (12-18)',
  evening: '저녁 (18-21)',
};

function makeInitialConfig(item: { basketItem: BasketItem; bid: Bid }, addresses: Address[]): DeliveryConfig {
  const defaultAddr = addresses.find((a) => a.isDefault) ?? null;
  return {
    basketItemId: item.basketItem.id,
    mode: defaultAddr ? 'saved' : 'new',
    addressId: defaultAddr?.id ?? null,
    newAddress: null,
    contactTime: 'morning',
    removeOldAppliance: false,
    installNote: '',
  };
}

function isConfigValid(config: DeliveryConfig): boolean {
  return config.mode === 'saved'
    ? config.addressId !== null
    : config.newAddress !== null;
}

export default function CheckoutFlow({ items, onBack, onComplete }: Props) {
  const [addresses] = useState<Address[]>(() => getAddresses());
  const [configs, setConfigs] = useState<DeliveryConfig[]>(() =>
    items.map((item) => makeInitialConfig(item, addresses))
  );
  const [phase, setPhase] = useState<Phase>('delivery');

  function updateConfig(index: number, config: DeliveryConfig) {
    setConfigs((prev) => prev.map((c, i) => (i === index ? config : c)));
  }

  const allValid = configs.every(isConfigValid);

  function resolveAddress(config: DeliveryConfig): Address | null {
    if (config.mode === 'saved') {
      return addresses.find((a) => a.id === config.addressId) ?? null;
    }
    return null;
  }

  if (phase === 'confirm') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">최종 확인</h1>

        <div className="space-y-4">
          {items.map((item, i) => {
            const config = configs[i];
            const savedAddr = resolveAddress(config);
            const addrDisplay = savedAddr
              ? `${savedAddr.address} ${savedAddr.addressDetail ?? ''}`.trim()
              : config.newAddress
              ? `${config.newAddress.address} ${config.newAddress.addressDetail ?? ''}`.trim()
              : '배송지 미선택';
            return (
              <div key={item.basketItem.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{CATEGORY_ICONS[item.basketItem.category] ?? '📦'}</span>
                  <span className="font-semibold text-gray-900">{item.basketItem.categoryName}</span>
                  <span className="ml-auto font-bold text-blue-700">{formatPrice(item.bid.totalPrice)}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="text-gray-400">배송지:</span> {addrDisplay}</p>
                  <p><span className="text-gray-400">연락 시간:</span> {CONTACT_TIME_LABELS[config.contactTime]}</p>
                  <p><span className="text-gray-400">폐가전 수거:</span> {config.removeOldAppliance ? '요청' : '미요청'}</p>
                  {config.installNote && (
                    <p><span className="text-gray-400">특이사항:</span> {config.installNote}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setPhase('delivery')}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            수정
          </button>
          <button
            onClick={onComplete}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            견적 요청 완료!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 장바구니
        </button>
        <h1 className="text-2xl font-bold text-gray-900">배송지 설정</h1>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <DeliveryItemCard
            key={item.basketItem.id}
            item={item}
            config={configs[i]}
            addresses={addresses}
            onChange={(cfg) => updateConfig(i, cfg)}
          />
        ))}
      </div>

      <button
        onClick={() => setPhase('confirm')}
        disabled={!allValid}
        className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        다음
      </button>
    </div>
  );
}
