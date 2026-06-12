import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Elpriskollen – se elområde och prisnivå i Sverige | Elchef.se',
  description:
    'Skriv in ditt postnummer och se aktuella prisnivåer för elavtal i ditt elområde (SE1–SE4). Elpriskollen från Elchef hjälper dig förstå om dina elpriser är rimliga innan du byter elavtal.',
  alternates: {
    canonical: '/elpriskollen',
  },
  openGraph: {
    title: 'Elpriskollen – se elområde och prisnivå i Sverige | Elchef.se',
    description:
      'Skriv in ditt postnummer och se aktuella prisnivåer för elavtal i ditt elområde (SE1–SE4). Elpriskollen från Elchef hjälper dig förstå om dina elpriser är rimliga innan du byter elavtal.',
    url: 'https://www.elchef.se/elpriskollen',
  },
};

export default function ElpriskollenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-elpriskollen"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Elpriskollen', path: '/elpriskollen' },
        ]}
      />
      {children}
    </>
  );
}

