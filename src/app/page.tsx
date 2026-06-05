/* 드림비드 — 서비스 준비 중 페이지 */
export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">🛒</span>
          <span className="text-4xl font-bold text-blue-700">드림비드</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-600 mb-3">서비스 준비 중입니다</h1>
        <p className="text-gray-400 text-sm">더 좋은 서비스로 곧 찾아뵙겠습니다</p>
      </div>
    </div>
  );
}
