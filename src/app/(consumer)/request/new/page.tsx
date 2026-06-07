import { readSingleData, readData } from '@/lib/data';
import type { ProductData } from '@/types';
import type { Ad } from '@/types/ad';
import NewRequestClient from './NewRequestClient';

export default function NewRequestPage() {
  const productData = readSingleData<ProductData>('products.json');
  const activeAds = readData<Ad>('ads.json').filter((a) => a.status === 'active');
  return <NewRequestClient productData={productData} activeAds={activeAds} />;
}
