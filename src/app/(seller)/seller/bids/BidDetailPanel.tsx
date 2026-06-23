'use client';

import { useState } from 'react';
import type { ListItem } from './SellerBidsClient';
import { formatPrice } from '@/lib/utils';

const COLLECTION_LABEL: Record<string, string> = {
  free: '무료 수거',
  paid: '유료 수거',
  unavailable: '수거 불가',
};

interface Props {
  item: ListItem | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className="ml-2 rounded border border-blue-200 px-1.5 py-0.5 text-[10px] font-medium text-blue-500 transition-colors hover:bg-blue-50"
    >
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

function InfoRow({ label, value, copyable }: { label: string; value?: string | null; copyable?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="w-20 shrink-0 text-xs text-gray-400">{label}</span>
      <span className="flex-1 break-all text-sm text-gray-800">
        {value}
        {copyable && <CopyButton text={value} />}
      </span>
    </div>
  );
}

export default function BidDetailPanel({ item }: Props) {
  const [orderNum, setOrderNum] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNum, setTrackingNum] = useState('');

  if (!item) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-gray-400">
        항목을 선택하면 상세 정보가 표시됩니다
      </div>
    );
  }

  const { request: req, order, bid } = item;

  const fullAddress = req?.deliveryAddress
    ? `${req.deliveryAddress}${req.deliveryAddressDetail ? ' ' + req.deliveryAddressDetail : ''}`
    : order?.installAddress ?? null;
  const hasDeliveryInfo = !!(req?.deliveryRecipient || req?.deliveryPhone || fullAddress);

  return (
    <div className="p-5">
      {/* 헤더 */}
      <div className="mb-4 border-b pb-3">
        <p className="text-base font-bold text-gray-900">
          {req?.categoryName ?? order?.categoryName ?? '알 수 없음'}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {order ? `주문번호: ${order.id}` : bid ? `비딩번호: ${bid.id}` : ''}
        </p>
      </div>

      {/* 배송·설치 정보 */}
      <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-gray-500">배송·설치 정보</p>
        {hasDeliveryInfo ? (
          <div className="divide-y divide-gray-100">
            <InfoRow label="수령인"   value={req?.deliveryRecipient} copyable />
            <InfoRow label="연락처"   value={req?.deliveryPhone} copyable />
            <InfoRow label="주소"     value={fullAddress} copyable />
            <InfoRow label="우편번호" value={req?.deliveryZipCode} />
            <InfoRow label="배송희망일" value={req?.deliveryDate ?? order?.installDate} />
          </div>
        ) : (
          <p className="text-xs text-gray-400">배송·설치 정보가 없습니다</p>
        )}
      </div>

      {/* 내 비딩 내역 */}
      {bid && (
        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-gray-500">내 비딩 내역</p>
          <div className="space-y-1">
            {bid.items.map(bi => (
              <div key={bi.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{bi.modelName}</span>
                <span className="font-semibold text-green-700">{formatPrice(bi.price)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-bold">
              <span className="text-gray-700">합계</span>
              <span className="text-green-700">{formatPrice(bid.totalPrice)}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>설치일: {bid.installDate}</span>
            <span>설치비 {bid.installFeeIncluded ? '포함' : '별도'}</span>
            <span>{COLLECTION_LABEL[bid.collectionService] ?? bid.collectionService}</span>
          </div>
        </div>
      )}

      {/* 주문 금액 요약 */}
      {order && (
        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-gray-500">주문 금액</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">결제금액</span>
              <span className="font-medium">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">수수료 ({(order.commissionRate * 100).toFixed(0)}%)</span>
              <span className="text-red-500">−{formatPrice(order.commissionAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold">
              <span className="text-gray-700">수령 예정액</span>
              <span className="text-green-700">{formatPrice(order.sellerAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 발주서 작성 (UI only) */}
      {order?.status === 'payment_completed' && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 px-4 py-4">
          <p className="mb-3 text-xs font-semibold text-blue-700">발주서 작성</p>
          <div className="mb-3 space-y-2">
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="발주 번호"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="배송업체명"
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="운송장 번호"
              value={trackingNum}
              onChange={e => setTrackingNum(e.target.value)}
            />
          </div>
          <button
            onClick={() => console.log('발주 완료', { orderId: order.id, orderNum, carrier, trackingNum })}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            발주 완료 처리
          </button>
        </div>
      )}
    </div>
  );
}
