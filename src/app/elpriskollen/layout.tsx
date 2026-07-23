import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Elpriskollen – se ditt elområde och elpris via postnummer | Elchef',
  description:
    'Ange postnummer och se elområde (SE1–SE4) samt prisnivå. Kolla om du betalar onödigt mycket innan du byter elavtal.',
  alternates: {
    canonical: '/elpriskollen',
  },
  openGraph: {
    title: 'Elpriskollen – se ditt elområde och elpris via postnummer | Elchef',
    description:
      'Ange postnummer och se elområde (SE1–SE4) samt prisnivå. Kolla om du betalar onödigt mycket innan du byter elavtal.',
    url: 'https://www.elchef.se/elpriskollen',
    images: [
      {
        url: '/elchef-logo.png',
        width: 1200,
        height: 630,
        alt: 'Elchef',
      },
    ],
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

