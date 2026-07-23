import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import FAQ from '@/components/FAQ';

export const metadata: Metadata = {
  title: 'Vanliga frågor om elavtal och elpriser | Elchef.se',
  description: 'Svar på vanliga frågor om elavtal, elpriser och hur du byter elleverantör.',
  alternates: { canonical: '/vanliga-fragor' },
  openGraph: {
    title: 'Vanliga frågor om elavtal och elpriser | Elchef.se',
    description: 'Svar på vanliga frågor om elavtal, elpriser och hur du byter elleverantör.',
    url: 'https://www.elchef.se/vanliga-fragor',
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

export default function VanligaFragor() {
  return (
    <main>
      <BreadcrumbJsonLd
        id="breadcrumb-vanliga-fragor"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Vanliga frågor', path: '/vanliga-fragor' },
        ]}
      />
      <FAQ headingLevel="h1" />
    </main>
  );
} 