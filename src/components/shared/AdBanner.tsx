'use client';

import type { Ad } from '@/types/ad';

interface Props {
  ads: Ad[];
  size?: 'large' | 'small';
  max?: number;
}

async function recordClick(id: string) {
  await fetch(`/api/ads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'click' }),
  });
}

function openContact(contact: string) {
  const url = contact.startsWith('http') ? contact : `tel:${contact}`;
  window.open(url, '_blank');
}

function LargeCard({ ad }: { ad: Ad }) {
  async function handleClick() {
    await recordClick(ad.id);
    openContact(ad.contact);
  }

  return (
    <button onClick={handleClick}
      className="w-full text-left rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-32 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl">🏪</span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">광고</span>
      </div>
      <div className="p-4">
        <p className="font-bold text-gray-900 text-sm mb-1">{ad.title}</p>
        <p className="text-xs text-gray-500 mb-3">{ad.description}</p>
        <p className="text-xs font-medium text-green-700">
          {ad.contact.startsWith('http') ? ad.contact : ad.contact} →
        </p>
      </div>
    </button>
  );
}

function SmallCard({ ad }: { ad: Ad }) {
  async function handleClick() {
    await recordClick(ad.id);
    openContact(ad.contact);
  }

  return (
    <button onClick={handleClick}
      className="w-full text-left border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs bg-white hover:bg-gray-50 transition-colors">
      <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-500 font-medium">광고</span>
      <span className="font-bold text-gray-800 flex-shrink-0">{ad.title}</span>
      <span className="text-gray-500 truncate">— {ad.description}</span>
      <span className="ml-auto flex-shrink-0 font-medium text-green-700">
        {ad.contact.startsWith('http') ? '바로가기' : ad.contact} →
      </span>
    </button>
  );
}

export default function AdBanner({ ads, size = 'large', max = 4 }: Props) {
  const visible = ads.slice(0, max);
  if (visible.length === 0) return null;

  if (size === 'small') {
    return (
      <div className="space-y-2">
        {visible.map((ad) => <SmallCard key={ad.id} ad={ad} />)}
      </div>
    );
  }

  return (
    <>
      {visible.map((ad) => <LargeCard key={ad.id} ad={ad} />)}
    </>
  );
}
