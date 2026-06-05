import Link from 'next/link';

/* 드림비드 소비자 메인 — 역경매 메커니즘 소개 및 진입 경로 안내 */
export default function ConsumerMainPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold text-blue-700">드림비드</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/consumer/login" className="text-sm text-gray-600 hover:text-blue-600">소비자 입장</Link>
            <Link href="/seller" className="text-sm text-gray-600 hover:text-blue-600">판매자 입장</Link>
            <Link href="/consumer/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              비딩 요청하기
            </Link>
          </nav>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-200">가전 역경매 플랫폼</p>
          <h1 className="mb-6 text-5xl font-bold leading-tight">
            판매자가 경쟁한다,<br />당신은 선택만 하세요
          </h1>
          <p className="mb-10 text-xl text-blue-100">
            원하는 가전 조건을 입력하면 인증된 판매자들이 직접 경쟁 입찰합니다.<br />
            최저가 보장, 설치까지 책임지는 드림비드입니다.
          </p>
          <div className="mb-10 flex justify-center gap-6">
            {[
              { icon: '📺', name: 'TV' },
              { icon: '🧊', name: '냉장고' },
              { icon: '❄️', name: '에어컨' },
              { icon: '🫧', name: '세탁기' },
              { icon: '👔', name: '의류관리기' },
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center gap-1">
                <span className="text-4xl">{item.icon}</span>
                <span className="text-xs text-blue-200">{item.name}</span>
              </div>
            ))}
          </div>
          <Link
            href="/request/new"
            className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors"
          >
            지금 바로 비딩 요청하기 →
          </Link>
        </div>
      </section>

      {/* 거래 프로세스 */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">이렇게 진행됩니다</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {[
              { step: '01', icon: '📝', title: '조건 입력', desc: '원하는 가전 스펙을 단계별로 선택하세요' },
              { step: '02', icon: '🏪', title: '판매자 비딩', desc: '인증 판매자들이 경쟁 입찰을 시작합니다' },
              { step: '03', icon: '🔍', title: '비딩 비교', desc: '최대 4개 비딩을 나란히 비교하세요' },
              { step: '04', icon: '✅', title: '비딩 선택', desc: '가장 마음에 드는 비딩을 선택합니다' },
              { step: '05', icon: '💳', title: '에스크로 결제', desc: '안전하게 에스크로로 결제됩니다' },
              { step: '06', icon: '🎉', title: '설치 완료', desc: '전문 기사가 방문해 설치까지 완료합니다' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-500">STEP {item.step}</span>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 신뢰 섹션 */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">3단계 판매자 검증</h2>
          <p className="mb-12 text-center text-gray-500">모든 판매자는 엄격한 인증 절차를 통과해야 합니다</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: '🏛️', title: '국세청 API 인증', desc: '사업자등록번호 실시간 조회로 유효한 사업자만 허용합니다' },
              { icon: '🗺️', title: '네이버 로드뷰 확인', desc: '실제 매장 위치를 로드뷰로 확인하여 실존 점포를 검증합니다' },
              { icon: '🏦', title: '계좌실명조회', desc: '은행 API로 계좌 실명을 확인해 안전한 정산을 보장합니다' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-6 shadow-sm text-center">
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">어떤 분이신가요?</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link href="/consumer/login" className="group rounded-2xl border-2 border-blue-100 bg-white p-8 shadow-sm transition-all hover:border-blue-400 hover:shadow-md">
              <div className="mb-4 text-4xl">🛒</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">소비자</h3>
              <p className="mb-4 text-sm text-gray-500">원하는 가전을 등록하고 판매자들의 경쟁 입찰을 받아보세요</p>
              <span className="text-sm font-medium text-blue-600 group-hover:underline">비딩 요청 시작 →</span>
            </Link>
            <Link href="/seller" className="group rounded-2xl border-2 border-green-100 bg-white p-8 shadow-sm transition-all hover:border-green-400 hover:shadow-md">
              <div className="mb-4 text-4xl">🏪</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">판매자</h3>
              <p className="mb-4 text-sm text-gray-500">검증된 소비자 요청에 경쟁력 있는 가격으로 입찰하세요</p>
              <span className="text-sm font-medium text-green-600 group-hover:underline">DreamBid Family →</span>
            </Link>
            <Link href="/admin" className="group rounded-2xl border-2 border-purple-100 bg-white p-8 shadow-sm transition-all hover:border-purple-400 hover:shadow-md">
              <div className="mb-4 text-4xl">⚙️</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">관리자</h3>
              <p className="mb-4 text-sm text-gray-500">플랫폼 전체를 모니터링하고 판매자를 관리하세요</p>
              <span className="text-sm font-medium text-purple-600 group-hover:underline">관리자 패널 →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-gray-900 py-12 text-center text-gray-400">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-xl">🛒</span>
          <span className="text-lg font-bold text-white">드림비드</span>
        </div>
        <p className="text-sm">더 싸게, 더 안전하게</p>
        <p className="mt-4 text-xs text-gray-600">© 2026 DreamBid. All rights reserved.</p>
      </footer>
    </div>
  );
}
