import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/ServiceJsonLd';

export const metadata: Metadata = {
  title: 'Fakturaanalys av elräkning med AI | Elchef.se',
  description:
    'Ladda upp din elräkning och få en tydlig AI-analys av dina elkostnader. Upptäck dolda avgifter och se hur mycket du kan spara med ett bättre elavtal.',
  alternates: {
    canonical: '/fakturaanalys',
  },
  openGraph: {
    title: 'Fakturaanalys av elräkning med AI | Elchef.se',
    description:
      'Ladda upp din elräkning och få en tydlig AI-analys av dina elkostnader. Upptäck dolda avgifter och se hur mycket du kan spara med ett bättre elavtal.',
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
        description="Ladda upp din elräkning och få en AI-analys av dina elkostnader med uppskattad besparingspotential."
        path="/fakturaanalys"
      />
      {children}
    </>
  );
}

