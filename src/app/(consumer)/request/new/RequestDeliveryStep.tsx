'use client';

import { useState } from 'react';
import type { Address, AddressInput } from '@/types/address';
import { getAddresses } from '@/lib/addressStorage';
import AddressForm from '@/components/consumer/AddressForm';
import { Button } from '@/components/shared/Button';

interface Props {
  initial?: AddressInput | null;
  onBack: () => void;
  onNext: (address: AddressInput) => void;
  isSubmitting?: boolean;
}

export default function RequestDeliveryStep({ initial, onBack, onNext, isSubmitting }: Props) {
  const [addresses] = useState<Address[]>(() => getAddresses());
  const [mode, setMode] = useState<'select' | 'new'>(() =>
    addresses.length === 0 ? 'new' : 'select',
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initial) return null;
    return addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  });
  const [newInput, setNewInput] = useState<AddressInput | null>(initial ?? null);

  function resolveSelected(): AddressInput | null {
    if (mode === 'new') return newInput;
    const addr = addresses.find((a) => a.id === selectedId);
    if (!addr) return null;
    const { id: _id, isDefault: _d, ...input } = addr;
    return input;
  }

  const ready = resolveSelected() !== null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">배송지 입력</h1>
      <p className="mb-8 text-gray-500">가전제품을 받을 주소와 연락처를 입력해주세요</p>

      {addresses.length > 0 && (
        <div className="mb-6 flex gap-2">
          {(['select', 'new'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m === 'select' ? '저장된 배송지' : '새 주소 입력'}
            </button>
          ))}
        </div>
      )}

      {mode === 'select' && (
        <div className="mb-6 space-y-3">
          {addresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => setSelectedId(addr.id)}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                selectedId === addr.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                    기본
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-900">{addr.recipient}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              <p className="mt-0.5 text-sm text-gray-600">
                [{addr.zipCode}] {addr.address}
                {addr.addressDetail && ` ${addr.addressDetail}`}
              </p>
            </button>
          ))}
        </div>
      )}

      {mode === 'new' && (
        <div className="mb-6">
          <AddressForm
            initial={newInput ?? undefined}
            onSave={setNewInput}
            saveLabel="이 주소로 설정"
          />
          {newInput && (
            <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              ✓ 주소가 설정되었습니다. 아래 버튼으로 계속 진행하세요.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>이전</Button>
        <Button
          className="flex-1"
          disabled={!ready}
          isLoading={isSubmitting}
          onClick={() => { const a = resolveSelected(); if (a) onNext(a); }}
        >
          견적 요청 완료
        </Button>
      </div>
    </div>
  );
}
