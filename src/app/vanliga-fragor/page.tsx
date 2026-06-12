import type { Metadata } from 'next';
import FAQ from '@/components/FAQ';

export const metadata: Metadata = {
  title: 'Vanliga frågor om elavtal och elpriser | Elchef.se',
  description: 'Svar på vanliga frågor om elavtal, elpriser och hur du byter elleverantör.',
  alternates: { canonical: '/vanliga-fragor' },
  openGraph: {
    title: 'Vanliga frågor om elavtal och elpriser | Elchef.se',
    description: 'Svar på vanliga frågor om elavtal, elpriser och hur du byter elleverantör.',
    url: 'https://www.elchef.se/vanliga-fragor',
  },
};

export default function VanligaFragor() {
  return (
    <main>
      <FAQ headingLevel="h1" />
    </main>
  );
} 