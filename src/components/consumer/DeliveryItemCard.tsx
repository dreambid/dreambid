'use client';

import { useState } from 'react';
import type { BasketItem, Bid } from '@/types';
import type { Address, DeliveryConfig, ContactTime, AddressInput } from '@/types/address';
import { formatPrice } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import AddressForm from './AddressForm';

interface Props {
  item: { basketItem: BasketItem; bid: Bid };
  config: DeliveryConfig;
  addresses: Address[];
  onChange: (config: DeliveryConfig) => void;
}

const CONTACT_TIMES: { value: ContactTime; label: string }[] = [
  { value: 'morning', label: '오전 (09-12)' },
  { value: 'afternoon', label: '오후 (12-18)' },
  { value: 'evening', label: '저녁 (18-21)' },
];

export default function DeliveryItemCard({ item, config, addresses, onChange }: Props) {
  const { basketItem, bid } = item;
  const [showNewForm, setShowNewForm] = useState(addresses.length === 0);

  function update(partial: Partial<DeliveryConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleAddressSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === '__new__') {
      setShowNewForm(true);
      update({ mode: 'new', addressId: null, newAddress: null });
    } else {
      setShowNewForm(false);
      update({ mode: 'saved', addressId: val, newAddress: null });
    }
  }

  function handleNewAddressSave(input: AddressInput) {
    update({ mode: 'new', newAddress: input, addressId: null });
    setShowNewForm(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      {/* Item header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[basketItem.category] ?? '📦'}</span>
          <div>
            <p className="font-semibold text-gray-900">{basketItem.categoryName}</p>
            <p className="text-sm text-gray-500">{bid.sellerName}</p>
          </div>
        </div>
        <p className="font-bold text-blue-700">{formatPrice(bid.totalPrice)}</p>
      </div>

      {/* Address selection */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">배송지</label>
        {addresses.length > 0 && !showNewForm && (
          <select
            value={config.addressId ?? ''}
            onChange={handleAddressSelect}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="" disabled>배송지를 선택하세요</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.recipient} — {a.address}
              </option>
            ))}
            <option value="__new__">다른 배송지 추가</option>
          </select>
        )}
        {(showNewForm || addresses.length === 0) && (
          <div className="mt-2">
            <AddressForm
              onSave={handleNewAddressSave}
              onCancel={addresses.length > 0 ? () => setShowNewForm(false) : undefined}
              saveLabel="이 배송지 사용"
            />
          </div>
        )}
        {config.mode === 'new' && config.newAddress && !showNewForm && (
          <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {config.newAddress.address} {config.newAddress.addressDetail}
            <button
              onClick={() => setShowNewForm(true)}
              className="ml-2 text-xs text-blue-500 hover:underline"
            >
              변경
            </button>
          </div>
        )}
      </div>

      {/* Contact time */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">연락 가능 시간</label>
        <div className="flex gap-2">
          {CONTACT_TIMES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ contactTime: value })}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                config.contactTime === value
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Old appliance removal */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={config.removeOldAppliance}
          onChange={(e) => update({ removeOldAppliance: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm text-gray-700">폐가전 수거 요청</span>
      </label>

      {/* Install note */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">설치 특이사항</label>
        <textarea
          value={config.installNote}
          onChange={(e) => update({ installNote: e.target.value })}
          placeholder="예: 엘리베이터 없음, 3층 계단"
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
