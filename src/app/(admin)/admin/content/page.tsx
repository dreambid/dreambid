import { readSingleData } from '@/lib/data';
import type { ProductData, ProductCategory } from '@/types/product';
import { HelpCircle } from 'lucide-react';

function CategoryCard({ cat }: { cat: ProductCategory }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat.icon}</span>
          <h3 className="font-semibold text-gray-900">{cat.name}</h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {cat.steps.length}단계
        </span>
      </div>
      <div className="space-y-2">
        {cat.steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <div className="flex-1">
              <span>{step.question}</span>
              {step.helpKey && <HelpCircle size={12} className="inline ml-1 text-gray-400" />}
              <div className="flex flex-wrap gap-1 mt-1">
                {step.options.map((opt) => (
                  <span key={opt.value} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {cat.hasModelInput && (
        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-3">
          모델명 직접 입력 지원
        </p>
      )}
    </div>
  );
}

export default function AdminContentPage() {
  const productData = readSingleData<ProductData>('products.json');
  const helpTextCount = Object.values(productData.helpTexts).reduce(
    (sum, texts) => sum + Object.keys(texts).length,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            카테고리 {productData.categories.length}개 · 도움말 텍스트 {helpTextCount}개
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <p className="font-medium text-gray-600 mb-1">수정 방법</p>
          <p>src/data/products.json 직접 편집</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">📝 현재 콘텐츠 뷰어 모드</p>
        <p className="text-xs text-amber-600 mt-1">
          카테고리/단계 편집은 <code className="bg-amber-100 px-1 rounded">src/data/products.json</code>을 직접 수정하거나 API를 통해 업데이트할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {productData.categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">도움말 텍스트 목록</h2>
        <div className="space-y-3">
          {Object.entries(productData.helpTexts).map(([key, texts]) => (
            <div key={key} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2 capitalize">{key}</p>
              <div className="grid gap-2">
                {Object.entries(texts).map(([optKey, text]) => (
                  <div key={optKey} className="text-xs text-gray-500">
                    <span className="font-mono text-blue-500">[{optKey}]</span>{' '}
                    {String(text).slice(0, 100)}{String(text).length > 100 ? '...' : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
