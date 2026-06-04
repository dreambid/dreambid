'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from 'recharts';

interface Props {
  categoryStats: Array<{ category: string; requests: number; bids: number }>;
  funnelData: Array<{ name: string; value: number; fill: string }>;
}

const MONTHLY_DATA = [
  { month: '1월', revenue: 12000000, commission: 240000 },
  { month: '2월', revenue: 18500000, commission: 370000 },
  { month: '3월', revenue: 22000000, commission: 440000 },
  { month: '4월', revenue: 19800000, commission: 396000 },
  { month: '5월', revenue: 31000000, commission: 620000 },
  { month: '6월', revenue: 2100000, commission: 42000 },
];

export default function AnalyticsCharts({ categoryStats, funnelData }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">월별 거래 현황</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => [`${(v / 10000).toLocaleString()}만원`, '']} />
              <Bar dataKey="revenue" name="거래액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="수수료" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">구매 전환 퍼널</h3>
          <ResponsiveContainer width="100%" height={230}>
            <FunnelChart>
              <Tooltip formatter={(v: number) => [`${v}건`, '']} />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="right" fill="#374151" stroke="none" dataKey="name" style={{ fontSize: 12 }} />
                {funnelData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">카테고리별 요청/입찰 현황</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={70} />
            <Tooltip />
            <Bar dataKey="requests" name="요청" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="bids" name="입찰" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
