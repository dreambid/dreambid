export type AddressLabel = '집' | '사무실' | '기타';
export type ContactTime = 'morning' | 'afternoon' | 'evening';

export interface Address {
  id: string;
  label: AddressLabel;
  recipient: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'>;

export interface DeliveryConfig {
  basketItemId: string;
  mode: 'saved' | 'new';
  addressId: string | null;
  newAddress: AddressInput | null;
  contactTime: ContactTime;
  removeOldAppliance: boolean;
  installNote: string;
}
