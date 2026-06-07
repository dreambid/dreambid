'use client';

import { useState } from 'react';
import type { AddressInput, AddressLabel } from '@/types/address';

interface Props {
  initial?: Partial<AddressInput>;
  onSave: (input: AddressInput) => void;
  onCancel?: () => void;
  saveLabel?: string;
}

const LABELS: AddressLabel[] = ['집', '사무실', '기타'];

function openKakaoPostcode(
  onComplete: (zipCode: string, address: string) => void
) {
  const open = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        onComplete(data.zonecode, data.roadAddress || data.jibunAddress);
      },
    }).open();
  };
  if ((window as any).daum?.Postcode) {
    open();
    return;
  }
  const s = document.createElement('script');
  s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  s.onload = open;
  document.head.appendChild(s);
}

export default function AddressForm({ initial, onSave, onCancel, saveLabel = '저장' }: Props) {
  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? '집');
  const [recipient, setRecipient] = useState(initial?.recipient ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [addressDetail, setAddressDetail] = useState(initial?.addressDetail ?? '');

  function handleSave() {
    if (!recipient.trim() || !phone.trim() || !zipCode || !address) return;
    onSave({ label, recipient: recipient.trim(), phone: phone.trim(), zipCode, address, addressDetail });
  }

  function handlePostcode() {
    openKakaoPostcode((z, a) => {
      setZipCode(z);
      setAddress(a);
    });
  }

  const isValid = recipient.trim() && phone.trim() && zipCode && address;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      {/* Label tabs */}
      <div className="flex gap-2">
        {LABELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLabel(l)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              label === l
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Recipient & Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            수령인 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="홍길동"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={zipCode}
            readOnly
            placeholder="우편번호"
            className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
          <button
            type="button"
            onClick={handlePostcode}
            className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            주소 검색
          </button>
        </div>
        <input
          type="text"
          value={address}
          readOnly
          placeholder="도로명 주소"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
        <input
          type="text"
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
          placeholder="상세주소 (동, 호수 등)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {saveLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}
