import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Energirådgivning | Elchef.se',
  description: 'Personlig energirådgivning från Elchef.se – kommer snart.',
  alternates: { canonical: '/energiradgivning' },
  robots: { index: false, follow: false },
};

export default function EnergiradgivningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
