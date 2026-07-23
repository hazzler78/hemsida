import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/ServiceJsonLd';

export const metadata: Metadata = {
  title: 'Byt elavtal enkelt – jämför rörligt och fastpris | Elchef.se',
  description:
    'Byt elavtal enkelt online. Jämför rörligt elavtal och fastprisavtal och låt Elchef guida dig till det elavtal som passar din ekonomi och risknivå bäst.',
  alternates: {
    canonical: '/byt-elavtal',
  },
  openGraph: {
    title: 'Byt elavtal enkelt – jämför rörligt och fastpris | Elchef.se',
    description:
      'Byt elavtal enkelt online. Jämför rörligt elavtal och fastprisavtal och låt Elchef guida dig till det elavtal som passar din ekonomi och risknivå bäst.',
    url: 'https://www.elchef.se/byt-elavtal',
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

export default function BytElavtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-byt-elavtal"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Byt elavtal', path: '/byt-elavtal' },
        ]}
      />
      <ServiceJsonLd
        id="service-byt-elavtal"
        name="Byt elavtal online"
        description="Byt elavtal enkelt online med hjälp av Elchef – jämför rörligt och fastpris och hitta rätt avtal."
        path="/byt-elavtal"
      />
      {children}
    </>
  );
}

