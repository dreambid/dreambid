'use client';

import { useRef, useState } from 'react';
import { AD_CATEGORIES, type AdCategory, type AdDuration } from '@/types/ad';

interface Props {
  sellerId: string;
  sellerName: string;
  onSuccess: () => void;
}

const DURATION_OPTIONS: { value: AdDuration; label: string }[] = [
  { value: '1week', label: '1주' },
  { value: '2weeks', label: '2주' },
  { value: '1month', label: '1개월' },
];

export default function AdForm({ sellerId, sellerName, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<AdCategory[]>([]);
  const [duration, setDuration] = useState<AdDuration>('1week');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string ?? '');
    reader.readAsDataURL(file);
  }

  function toggleCategory(id: AdCategory) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || categories.length === 0 || !contact) return;
    setSubmitting(true);
    try {
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, sellerName, title, imageUrl, description, categories, duration, contact }),
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900">홍보 등록</h2>

      {/* 제목 */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">홍보 제목</label>
          <span className="text-xs text-gray-400">{title.length}/20</span>
        </div>
        <input
          value={title} onChange={(e) => setTitle(e.target.value)} maxLength={20}
          placeholder="예) TV 최저가 보장!" required
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* 이미지 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">이미지 (선택)</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
          이미지 선택
        </button>
        {imageUrl && (
          <img src={imageUrl} alt="미리보기" className="mt-2 h-20 w-20 rounded-xl object-cover border border-gray-200" />
        )}
      </div>

      {/* 홍보 문구 */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">홍보 문구</label>
          <span className="text-xs text-gray-400">{description.length}/50</span>
        </div>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} maxLength={50}
          placeholder="예) 삼성/LG 전 모델 최저가 견적. 당일 설치 가능" required rows={2}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">노출 카테고리</label>
        <div className="grid grid-cols-3 gap-2">
          {AD_CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                categories.includes(cat.id)
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기간 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">노출 기간</label>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setDuration(opt.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                duration === opt.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 연락처 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">연락처 / 링크</label>
        <input
          value={contact} onChange={(e) => setContact(e.target.value)}
          placeholder="010-0000-0000 또는 https://..." required
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
        {submitting ? '등록 중...' : '등록 요청'}
      </button>
      <p className="text-center text-xs text-gray-400">관리자 승인 후 노출됩니다</p>
    </form>
  );
}
