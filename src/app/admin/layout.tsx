import type { Metadata } from 'next';
import AdminAuthGate from '@/components/admin/AdminAuthGate';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminAuthGate>{children}</AdminAuthGate>
    </div>
  );
}
