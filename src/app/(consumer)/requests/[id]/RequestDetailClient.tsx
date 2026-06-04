'use client';
import { useState } from 'react';
import type { Bid } from '@/types';
import { BidComparison } from '@/components/consumer/BidComparison';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';

interface Props {
  bids: Bid[];
  requestId: string;
}

export default function RequestDetailClient({ bids }: Props) {
  const [showCompare, setShowCompare] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setShowCompare(true)}>
        비딩 비교
      </Button>
      <Modal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        title="비딩 비교"
        size="xl"
      >
        <BidComparison bids={bids.slice(0, 4)} />
      </Modal>
    </>
  );
}
