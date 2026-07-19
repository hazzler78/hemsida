import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Elpriskollen – se ditt elområde och elpris via postnummer | Elchef',
  description:
    'Ange postnummer och se vilket elområde du tillhör (SE1–SE4) samt prisnivå för elavtal. Kolla om ditt elpris är rimligt innan du byter.',
  alternates: {
    canonical: '/elpriskollen',
  },
  openGraph: {
    title: 'Elpriskollen – se ditt elområde och elpris via postnummer | Elchef',
    description:
      'Ange postnummer och se vilket elområde du tillhör (SE1–SE4) samt prisnivå för elavtal. Kolla om ditt elpris är rimligt innan du byter.',
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

