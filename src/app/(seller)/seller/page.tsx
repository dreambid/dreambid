import Link from 'next/link';

/* DreamBid Family — 판매자 전용 랜딩 페이지 */
export default function SellerLandingPage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 py-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-green-200">
            인증 판매자 전용 역경매 플랫폼
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight">
            소비자가 요청한다,<br />당신이 제안하세요
          </h1>
          <p className="mb-10 text-xl text-green-100">
            검증된 소비자의 가전 요청에 직접 입찰하세요.<br />
            경쟁 없는 우리 지역 고객을 먼저 잡으세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/seller/login"
              className="rounded-xl bg-white px-8 py-4 text-base font-bold text-green-700 shadow-lg hover:bg-green-50 transition-colors"
            >
              판매자 로그인
            </Link>
            <Link
              href="/seller/register"
              className="rounded-xl border-2 border-white px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-colors"
            >
              판매자 가입 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 혜택 */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            DreamBid Family 혜택
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: '🎯',
                title: '확실한 구매 의도',
                desc: '비딩 요청을 올린 소비자는 이미 구매를 결정한 고객입니다. 콜드 영업 없이 준비된 고객만 만나세요.',
              },
              {
                icon: '📊',
                title: '경쟁 입찰 시스템',
                desc: '최대 4개 판매자가 경쟁 입찰합니다. 가격과 조건으로 차별화하여 낙찰 확률을 높이세요.',
              },
              {
                icon: '🔒',
                title: '에스크로 안전 결제',
                desc: '드림비드 에스크로로 설치 완료 후 정산됩니다. 미수금 걱정 없이 안심하고 영업하세요.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
                <div className="mb-4 text-5xl">{item.icon}</div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3단계 판매자 인증 */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">3단계 판매자 검증</h2>
          <p className="mb-12 text-center text-gray-500">
            인증된 판매자만 입찰 가능 — 소비자 신뢰도를 높여 낙찰률을 올리세요
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: '🏛️', title: '국세청 API 인증', desc: '사업자등록번호 실시간 조회로 유효한 사업자임을 증명합니다' },
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

      {/* 하단 CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">지금 바로 시작하세요</h2>
          <p className="mb-8 text-gray-500">
            가입 심사는 영업일 기준 1~3일이 소요됩니다.<br />
            승인 즉시 소비자 요청에 입찰할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/seller/register"
              className="rounded-xl bg-green-600 px-8 py-4 text-base font-bold text-white hover:bg-green-700 transition-colors shadow-lg"
            >
              판매자 가입 신청 →
            </Link>
            <Link
              href="/seller/login"
              className="rounded-xl border-2 border-gray-300 px-8 py-4 text-base font-bold text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors"
            >
              기존 판매자 로그인
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-gray-900 py-10 text-center text-gray-400">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-xl">🏪</span>
          <span className="text-lg font-bold text-white">DreamBid Family</span>
        </div>
        <p className="text-sm">인증 판매자 전용 역경매 플랫폼</p>
        <p className="mt-4 text-xs text-gray-600">© 2026 DreamBid. All rights reserved.</p>
      </footer>
    </div>
  );
}
