'use client';

import { useState, useMemo } from 'react';

// --- [1. 타입 정의 및 도메인 모델] ---
// 4번 메뉴는 "설치확정(=결제완료) 이후"부터 시작하는 순수 정산 파이프라인입니다.
// 미결제 취소(overdue_cancelled)는 3번 메뉴(비딩관리) 영역이므로 여기 포함하지 않습니다.
export type SettlementStatus = 'pending' | 'confirmed' | 'processing' | 'settled';
export type PaymentMethod = 'card' | 'bank_transfer';
export type InvoiceStatus = 'not_applicable' | 'unissued' | 'requested' | 'issued';

export interface Settlement {
  id: string;
  settlementNo: string;        // 정산 고유 번호 (ex. ST-20260630-01)
  bidId: string;
  orderId: string;
  productName: string;
  paymentMethod: PaymentMethod;
  paidAt: string | null;       // 3번 메뉴에서 이미 결제 완료된 시각

  // 금액 산정 (세금계산서 금액과 1원 단위 일치하도록 설계됨)
  supplyAmount: number;        // 공급가액
  vatAmount: number;           // 부가세
  totalAmount: number;         // 소비자 결제 총액 (ex. 100만원)
  platformFee: number;         // 드림비드 중개 마진 (ex. 2만원)

  pgFee: number;                // 플랫폼 내부 비용 (참조용 표시만, 정산 계산에서 제외)
  deductAmount: number;         // 기타 차감액 (페널티 등)

  // sellerPayoutAmount = totalAmount - platformFee (판매자 발행 매입계산서 금액과 정확히 일치)
  sellerPayoutAmount: number;
  finalPayment: number;         // 실제 통장 입금액 (sellerPayoutAmount - deductAmount)

  status: SettlementStatus;
  installConfirmedAt: string;   // 고객 설치 확인일 (정산 대상 진입일)
  expectedSettlementDate: string; // 익월 정산 예정일
  settledAt: string | null;

  // 양방향 세금계산서 트래킹
  consumerInvoice: {
    required: boolean;          // bank_transfer 결제일 때만 true (카드결제는 매출전표가 대체)
    status: InvoiceStatus;
    amount: number;             // totalAmount와 동일
  };
  sellerInvoice: {
    status: Exclude<InvoiceStatus, 'not_applicable'>; // 판매자->플랫폼은 결제수단 불문 항상 필요
    amount: number;              // sellerPayoutAmount와 동일
  };
}

interface Props {
  initialSettlements: Settlement[];
}

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '정산대기' },
  { id: 'confirmed', label: '정산확정' },
  { id: 'processing', label: '지급중' },
  { id: 'settled', label: '지급완료' },
];

export default function SettlementClient({ initialSettlements = [] }: Props) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);

  const summary = useMemo(() => {
    return initialSettlements.reduce(
      (acc, item) => {
        if (item.status === 'pending') acc.pending += item.finalPayment;
        if (item.status === 'confirmed') acc.confirmed += item.finalPayment;
        if (item.status === 'settled') acc.settled += item.finalPayment;
        return acc;
      },
      { pending: 0, confirmed: 0, settled: 0 }
    );
  }, [initialSettlements]);

  const filteredSettlements = useMemo(() => {
    return initialSettlements.filter((item) => {
      if (activeTab !== 'all' && item.status !== activeTab) return false;

      if (searchQuery.trim()) {
        const keywords = searchQuery.toLowerCase().split(' ').filter(Boolean);
        const searchTarget = `${item.settlementNo} ${item.productName}`.toLowerCase();
        return keywords.every((kw) => searchTarget.includes(kw));
      }
      return true;
    });
  }, [initialSettlements, activeTab, searchQuery]);

  const selectedItem = useMemo(() => {
    return initialSettlements.find((b) => b.id === selectedSettlementId) || null;
  }, [initialSettlements, selectedSettlementId]);

  const handleExcelDownload = () => {
    alert(`현재 필터링된 ${filteredSettlements.length}건의 정산 내역을 엑셀로 추출합니다.`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">정산관리 <span className="text-sm font-normal text-gray-500">| 매입·매출 증빙 정밀 검수 공장</span></h1>
        <button
          onClick={handleExcelDownload}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          📊 엑셀 일괄 다운로드
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">정산 대기 금액</p>
          <p className="text-2xl font-bold text-amber-500 mt-2">₩{summary.pending.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">익월 지급예정 금액</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">₩{summary.confirmed.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">당월 지급 완료 총액</p>
          <p className="text-2xl font-bold text-green-600 mt-2">₩{summary.settled.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 border-b border-gray-100 w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedSettlementId(null); }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="정산번호 또는 상품명 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-950"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <SettlementListPanel
            settlements={filteredSettlements}
            selectedId={selectedSettlementId}
            onSelect={setSelectedSettlementId}
          />
        </div>

        <div className="lg:col-span-7 sticky top-6">
          <SettlementDetailPanel item={selectedItem} />
        </div>
      </div>
    </div>
  );
}

function SettlementListPanel({
  settlements,
  selectedId,
  onSelect
}: {
  settlements: Settlement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (settlements.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm shadow-sm">
        조건에 부합하는 정산 내역이 없습니다.
      </div>
    );
  }

  const statusBadges: Record<SettlementStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-purple-50 text-purple-700 border-purple-200',
    settled: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
      {settlements.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`p-4 bg-white rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 shadow-sm ${
              isSelected ? 'border-gray-950 ring-1 ring-gray-950 bg-gray-50/50' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusBadges[item.status]}`}>
                  {TABS.find(t => t.id === item.status)?.label || item.status}
                </span>
                <p className="text-xs text-gray-400 mt-1.5 font-mono">{item.settlementNo}</p>
                <h3 className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-1">{item.productName}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">₩{item.finalPayment.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400 mt-1">지급예정: {item.expectedSettlementDate}</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2 border-t border-gray-100">
              <div>결제증빙: <span className="font-medium text-gray-700">{item.paymentMethod === 'card' ? '💳 카드전표 대체' : '🏦 현금계산서 필요'}</span></div>
              <div>설치확정: {item.installConfirmedAt}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettlementDetailPanel({ item }: { item: Settlement | null }) {
  if (!item) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm shadow-sm">
        ← 정산 검수 및 세금계산서 증빙 처리를 위해 좌측 리스트에서 내역을 선택해 주세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-gray-400">ID: {item.id}</span>
          <span className="text-xs text-gray-500">설치확정일: {item.installConfirmedAt}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mt-1">{item.productName}</h2>
        <p className="text-sm font-mono text-gray-500 mt-0.5">정산번호: {item.settlementNo}</p>
      </div>

      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">💰 국세청 증빙 일치 정산서</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>소비자 결제 총액 (A)</span>
          <span className="font-semibold text-gray-900">₩{item.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 pl-3">
          <span>ㄴ 공급가액</span>
          <span>₩{item.supplyAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 pl-3 pb-2 border-b border-gray-200/60">
          <span>ㄴ 부가세 (10%)</span>
          <span>₩{item.vatAmount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>드림비드 플랫폼 마진 (B)</span>
          <span className="font-semibold text-red-600">-₩{item.platformFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-400 pl-3 pb-2 border-b border-gray-200/60">
          <span>※ [참조] PG 대행 수수료 (플랫폼 마진 내 자체 흡수분)</span>
          <span>₩{item.pgFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm font-bold text-gray-800 bg-white p-2 rounded border border-gray-200/80">
          <span>판매자 기본 지급액 (A - B) <span className="text-xs font-normal text-gray-400">(=역매입 계산서 금액)</span></span>
          <span className="text-gray-900">₩{item.sellerPayoutAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 pt-1">
          <span>기타 페널티/차감액 (C)</span>
          <span className="font-semibold text-red-600">-₩{item.deductAmount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>최종 통장 입금 금액 (기본지급액 - C)</span>
          <span className="text-blue-600 text-lg">₩{item.finalPayment.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900">📑 양방향 전자세금계산서 증빙 공장</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">1. 소비자 결제 증빙</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                item.consumerInvoice.status === 'not_applicable' ? 'bg-gray-100 text-gray-500' :
                item.consumerInvoice.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {item.consumerInvoice.status === 'not_applicable' ? '해당없음(카드)' :
                 item.consumerInvoice.status === 'issued' ? '발행완료' : '발행대기'}
              </span>
            </div>
            <p className="text-xs text-gray-500">대상 금액: ₩{item.consumerInvoice.amount.toLocaleString()}</p>
            {item.consumerInvoice.required ? (
              <button className="w-full text-center text-xs border border-gray-300 hover:bg-gray-50 text-gray-600 py-1.5 rounded mt-2 transition-colors">
                📄 홈택스 소비자 계산서 발행
              </button>
            ) : (
              <p className="text-[11px] text-gray-400 bg-gray-50 p-2 rounded mt-2 leading-relaxed">
                * 신용카드 매출전표가 증빙 역할을 하므로 계산서 발행이 제한됩니다.
              </p>
            )}
          </div>

          <div className="border border-gray-200 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">2. 판매점 역매입 증빙</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                item.sellerInvoice.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {item.sellerInvoice.status === 'issued' ? '발행완료' : '발행요청'}
              </span>
            </div>
            <p className="text-xs text-blue-600 font-semibold">계산서 일치 금액: ₩{item.sellerInvoice.amount.toLocaleString()}</p>
            <div className="flex gap-1.5 mt-2">
              <button className="flex-1 text-center text-[11px] bg-gray-900 hover:bg-gray-800 text-white py-1.5 rounded transition-colors">
                승인 및 완료
              </button>
              <button className="flex-1 text-center text-[11px] border border-red-200 hover:bg-red-50 text-red-600 py-1.5 rounded transition-colors">
                반려
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
        <span>💡</span>
        <p className="leading-relaxed">
          본 정산건의 지급 예정일은 <span className="font-bold">{item.expectedSettlementDate}</span>입니다. (설치확정 익월 정산 일괄 지급 규칙 자동 반영 완료)
        </p>
      </div>
    </div>
  );
}
