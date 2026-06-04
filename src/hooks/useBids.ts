'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bid } from '@/types';

export function useBids(auctionId?: string) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    try {
      setLoading(true);
      const params = auctionId ? `?auctionId=${auctionId}` : '';
      const res = await fetch(`/api/bids${params}`);
      if (!res.ok) throw new Error('입찰 목록을 불러오는데 실패했습니다');
      const data = await res.json();
      setBids(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return { bids, loading, error, refetch: fetchBids };
}
