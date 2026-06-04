import { readData } from '@/lib/data';
import type { Consumer } from '@/types/user';
import ConsumersClient from './ConsumersClient';

export default function AdminConsumersPage() {
  const consumers = readData<Consumer>('consumers.json');
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">소비자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 {consumers.length}명 · 활성 {consumers.filter((c) => c.status === 'active').length}명</p>
      </div>
      <ConsumersClient consumers={consumers} />
    </div>
  );
}
