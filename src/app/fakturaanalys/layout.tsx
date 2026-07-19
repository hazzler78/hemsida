import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/ServiceJsonLd';

export const metadata: Metadata = {
  title: 'Analysera din elräkning gratis – hitta dolda avgifter | Elchef',
  description:
    'Ladda upp elräkningen och få gratis AI-analys på 30 sekunder. Se dolda avgifter, påslag och hur mycket du kan spara med ett bättre elavtal.',
  alternates: {
    canonical: '/fakturaanalys',
  },
  openGraph: {
    title: 'Analysera din elräkning gratis – hitta dolda avgifter | Elchef',
    description:
      'Ladda upp elräkningen och få gratis AI-analys på 30 sekunder. Se dolda avgifter, påslag och hur mycket du kan spara med ett bättre elavtal.',
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

