import type { Address, AddressInput } from '@/types/address';

const STORAGE_KEY = 'dreambid_addresses';

export function getAddresses(): Address[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Address[]) : [];
  } catch {
    return [];
  }
}

function persist(addresses: Address[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

function generateId(): string {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveAddress(input: AddressInput): Address {
  const addresses = getAddresses();
  const isFirst = addresses.length === 0;
  const newAddr: Address = {
    ...input,
    id: generateId(),
    isDefault: isFirst,
  };
  persist([...addresses, newAddr]);
  return newAddr;
}

export function updateAddress(id: string, input: AddressInput): void {
  const addresses = getAddresses();
  const updated = addresses.map((a) =>
    a.id === id ? { ...a, ...input } : a
  );
  persist(updated);
}

export function deleteAddress(id: string): void {
  const addresses = getAddresses();
  const remaining = addresses.filter((a) => a.id !== id);
  // If we deleted the default, promote the first remaining address
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  persist(remaining);
}

export function setDefaultAddress(id: string): void {
  const addresses = getAddresses();
  const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
  persist(updated);
}
