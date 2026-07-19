import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/ServiceJsonLd';

export const metadata: Metadata = {
  title: 'Kolla elräkningen gratis – sluta betala onödiga avgifter | Elchef',
  description:
    'De flesta betalar extra kostnader i onödan. Ladda upp elräkningen och få gratis AI-analys: se påslag, dolda avgifter och hur mycket du kan spara.',
  alternates: {
    canonical: '/fakturaanalys',
  },
  openGraph: {
    title: 'Kolla elräkningen gratis – sluta betala onödiga avgifter | Elchef',
    description:
      'De flesta betalar extra kostnader i onödan. Ladda upp elräkningen och få gratis AI-analys: se påslag, dolda avgifter och hur mycket du kan spara.',
    url: 'https://www.elchef.se/fakturaanalys',
  },
};

export default function FakturaanalysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-fakturaanalys"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Fakturaanalys', path: '/fakturaanalys' },
        ]}
      />
      <ServiceJsonLd
        id="service-fakturaanalys"
        name="AI-fakturaanalys av elräkning"
        description="Gratis AI-analys som visar onödiga extrakostnader, påslag och dolda avgifter på din elräkning – och hur mycket du kan spara."
        path="/fakturaanalys"
      />
      {children}
    </>
  );
}

