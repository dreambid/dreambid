'use client';

import type { Ad, AdCategory } from '@/types/ad';
import AdBanner from '@/components/shared/AdBanner';

interface Props {
  activeAds: Ad[];
  categoryId: string;
}

export default function CategoryAdBanner({ activeAds, categoryId }: Props) {
  const categoryAds = activeAds.filter((a) =>
    a.categories.includes(categoryId as AdCategory),
  );
  if (categoryAds.length === 0) return null;
  return (
    <div className="mt-6">
      <AdBanner ads={categoryAds} size="small" max={1} />
    </div>
  );
}
