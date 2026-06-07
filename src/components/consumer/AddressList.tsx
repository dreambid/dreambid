'use client';

import { useState, useEffect } from 'react';
import type { Address, AddressInput } from '@/types/address';
import {
  getAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/addressStorage';
import AddressForm from './AddressForm';

interface Props {
  onSelect?: (address: Address) => void;
  selectable?: boolean;
  selectedId?: string | null;
}

export default function AddressList({ onSelect, selectable, selectedId }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setAddresses(getAddresses());
  }, []);

  function refresh() {
    setAddresses(getAddresses());
  }

  function handleSaveNew(input: AddressInput) {
    saveAddress(input);
    refresh();
    setShowForm(false);
  }

  function handleUpdate(id: string, input: AddressInput) {
    updateAddress(id, input);
    refresh();
    setEditId(null);
  }

  function handleDelete(id: string) {
    deleteAddress(id);
    refresh();
  }

  function handleSetDefault(id: string) {
    setDefaultAddress(id);
    refresh();
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
          <p className="mb-3 text-gray-400">배송지가 없습니다</p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + 배송지 추가
          </button>
        </div>
      )}

      {addresses.map((addr) => (
        <div key={addr.id}>
          {editId === addr.id ? (
            <AddressForm
              initial={addr}
              onSave={(input) => handleUpdate(addr.id, input)}
              onCancel={() => setEditId(null)}
              saveLabel="수정 완료"
            />
          ) : (
            <div
              onClick={() => selectable && onSelect?.(addr)}
              className={`rounded-xl border p-4 transition-colors ${
                selectable ? 'cursor-pointer hover:border-blue-300' : ''
              } ${selectedId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              {/* Badges */}
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                    기본 배송지
                  </span>
                )}
              </div>

              {/* Info */}
              <p className="font-medium text-gray-900">{addr.recipient}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              <p className="mt-1 text-sm text-gray-600">
                [{addr.zipCode}] {addr.address}
                {addr.addressDetail && ` ${addr.addressDetail}`}
              </p>

              {/* Actions */}
              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                {!addr.isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                    className="hover:text-blue-600 transition-colors"
                  >
                    기본으로 설정
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditId(addr.id); setShowForm(false); }}
                  className="hover:text-gray-700 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                  className="hover:text-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showForm && (
        <AddressForm
          onSave={handleSaveNew}
          onCancel={() => setShowForm(false)}
          saveLabel="추가"
        />
      )}

      {addresses.length > 0 && !showForm && (
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + 배송지 추가
        </button>
      )}
    </div>
  );
}
