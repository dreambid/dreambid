import { AdminAuthWrapper } from '@/components/admin/AdminAuthWrapper';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthWrapper>{children}</AdminAuthWrapper>;
}
