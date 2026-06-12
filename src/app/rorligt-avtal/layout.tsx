import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/ServiceJsonLd';

export const metadata: Metadata = {
  title: 'Rörligt elavtal – jämför bästa rörliga elavtal 2026 | Elchef.se',
  description:
    'Jämför rörliga elavtal i Sverige, se påslag och månadsavgifter och hitta bästa rörliga elavtal 2026 för din ekonomi i elområden som SE3 och SE4.',
  alternates: {
    canonical: '/rorligt-avtal',
  },
  openGraph: {
    title: 'Rörligt elavtal – jämför bästa rörliga elavtal 2026 | Elchef.se',
    description:
      'Jämför rörliga elavtal i Sverige, se påslag och månadsavgifter och hitta bästa rörliga elavtal 2026 för din ekonomi i elområden som SE3 och SE4.',
    url: 'https://www.elchef.se/rorligt-avtal',
  },
};

export default function RorligtAvtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-rorligt-avtal"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Rörligt elavtal', path: '/rorligt-avtal' },
        ]}
      />
      <ServiceJsonLd
        id="service-rorligt-avtal"
        name="Jämför rörliga elavtal"
        description="Jämför rörliga elavtal i Sverige och hitta bästa erbjudandet med lågt påslag och rimlig månadsavgift."
        path="/rorligt-avtal"
      />
      {children}
    </>
  );
}
