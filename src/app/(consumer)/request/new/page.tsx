import { readSingleData } from '@/lib/data';
import type { ProductData } from '@/types';
import NewRequestClient from './NewRequestClient';

export default function NewRequestPage() {
  const productData = readSingleData<ProductData>('products.json');
  return <NewRequestClient productData={productData} />;
}
