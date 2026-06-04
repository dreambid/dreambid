import SettingsClient from './SettingsClient';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-sm text-gray-500 mt-1">플랫폼 운영 정책 및 임계값 설정</p>
      </div>
      <SettingsClient />
    </div>
  );
}
