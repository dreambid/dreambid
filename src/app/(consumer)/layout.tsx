import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header role="consumer" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
