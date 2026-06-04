import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '드림비드 — 더 싸게, 더 안전하게',
  description: '가전제품 프라이빗 역경매 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
