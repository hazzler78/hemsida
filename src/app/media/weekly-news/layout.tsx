import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veckans nyheter från elmarknaden | Elchef i media',
  description:
    'Senaste nyheterna och uppdateringarna från elmarknaden som påverkar dig som konsument – samlat av Elchef.se.',
  alternates: { canonical: '/media/weekly-news' },
  openGraph: {
    title: 'Veckans nyheter från elmarknaden | Elchef i media',
    description:
      'Senaste nyheterna och uppdateringarna från elmarknaden som påverkar dig som konsument – samlat av Elchef.se.',
    url: 'https://www.elchef.se/media/weekly-news',
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

export default function WeeklyNewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
