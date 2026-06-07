'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'dreambid_admin_settings';

interface Settings {
  commissionRate: number;
  bidExpiryDays: number;
  maxBidsPerRequest: number;
  autoApproveThreshold: number;
  escrowAutoReleaseDays: number;
  minSellerRating: number;
}

const DEFAULTS: Settings = {
  commissionRate: 2,
  bidExpiryDays: 7,
  maxBidsPerRequest: 10,
  autoApproveThreshold: 4.5,
  escrowAutoReleaseDays: 3,
  minSellerRating: 3.5,
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const set = (key: keyof Settings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields: Array<{
    key: keyof Settings;
    label: string;
    desc: string;
    unit: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: 'commissionRate', label: '수수료율', desc: '거래 완료 시 플랫폼이 수취하는 수수료 비율', unit: '%', min: 0, max: 10, step: 0.5 },
    { key: 'bidExpiryDays', label: '입찰 요청 만료일', desc: '비딩 요청이 자동 만료되는 기간', unit: '일', min: 1, max: 30, step: 1 },
    { key: 'maxBidsPerRequest', label: '요청당 최대 입찰 수', desc: '하나의 요청에 받을 수 있는 최대 입찰 수', unit: '건', min: 3, max: 20, step: 1 },
    { key: 'autoApproveThreshold', label: '자동 승인 최소 평점', desc: '이 평점 이상인 판매자는 자동 승인 처리 가능', unit: '점', min: 0, max: 5, step: 0.1 },
    { key: 'escrowAutoReleaseDays', label: '에스크로 자동 해제일', desc: '설치 확인 후 이 기간이 지나면 자동으로 판매자에게 지급', unit: '일', min: 1, max: 14, step: 1 },
    { key: 'minSellerRating', label: '판매자 최소 유지 평점', desc: '이 평점 미만 시 경고 알림 발송', unit: '점', min: 0, max: 5, step: 0.1 },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">플랫폼 운영 설정</h2>
        {fields.map(({ key, label, desc, unit, min, max, step }) => (
          <div key={key} className="flex items-start gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800">{label}</label>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="number"
                value={settings[key]}
                onChange={(e) => set(key, parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 w-6">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">알림 설정</h2>
        {[
          { label: '신규 비딩 요청 알림', desc: '새 비딩 요청 생성 시 관리자 알림', key: 'notifyNewRequest' },
          { label: '판매자 승인 대기 알림', desc: '신규 판매자 가입 시 알림', key: 'notifyNewSeller' },
          { label: '분쟁 발생 알림', desc: '에스크로 분쟁 발생 시 즉시 알림', key: 'notifyDispute' },
        ].map(({ label, desc, key }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {saved ? <><CheckCircle size={16} /> 저장됨</> : <><Save size={16} /> 설정 저장</>}
      </button>
    </div>
  );
}
