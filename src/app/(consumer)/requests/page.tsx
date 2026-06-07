import Link from 'next/link';
import { readData } from '@/lib/data';
import type { BidRequest } from '@/types';
import { RequestCard } from '@/components/consumer/RequestCard';
import { Button } from '@/components/shared/Button';
import { RequireConsumerAuth } from '@/components/shared/RequireConsumerAuth';
import { getConsumerServerSession } from '@/lib/serverSession';

export default async function RequestsPage() {
  const session = await getConsumerServerSession();
  const consumerId = session?.consumerId ?? '';

  const myRequests = readData<BidRequest>('bid-requests.json')
    .filter((r) => r.consumerId === consumerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <RequireConsumerAuth>
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 비딩 요청</h1>
          <p className="mt-1 text-sm text-gray-500">판매자들이 제출한 견적을 확인하고 선택하세요</p>
        </div>
        <Link href="/request/new">
          <Button size="sm">+ 새 요청</Button>
        </Link>
      </div>

      {myRequests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="mb-3 text-4xl">📋</p>
          <p className="mb-4 text-gray-500">아직 비딩 요청이 없습니다</p>
          <Link href="/request/new">
            <Button>첫 비딩 요청하기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
    </RequireConsumerAuth>
  );
}
