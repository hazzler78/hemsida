import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Fast elpris – jämför fastprisavtal 2026 | Elchef.se',
  description:
    'Jämför fastprisavtal för el i Sverige och lås elpriset. Se kampanjer, prisgaranti och månadsavgift och hitta bästa fastprisavtal 2026 för en trygg elkostnad.',
  alternates: {
    canonical: '/fastpris-avtal',
  },
  openGraph: {
    title: 'Fast elpris – jämför fastprisavtal 2026 | Elchef.se',
    description:
      'Jämför fastprisavtal för el i Sverige och lås elpriset. Se kampanjer, prisgaranti och månadsavgift och hitta bästa fastprisavtal 2026 för en trygg elkostnad.',
    url: 'https://www.elchef.se/fastpris-avtal',
  },
};

export default function FastprisAvtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-fastpris-avtal"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Fastprisavtal', path: '/fastpris-avtal' },
        ]}
      />
      {children}
    </>
  );
}
