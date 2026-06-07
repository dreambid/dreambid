import { readData } from '@/lib/data';
import type { Ad } from '@/types/ad';
import AdsAdminClient from './AdsAdminClient';

export default function AdminAdsPage() {
  const allAds = readData<Ad>('ads.json');
  const pendingAds = allAds.filter((a) => a.status === 'pending');
  return <AdsAdminClient pendingAds={pendingAds} allAds={allAds} />;
}
