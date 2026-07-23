import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bli partner med Elchef – affiliateprogram',
  description:
    'Anslut dig till Elchefs partnerprogram och tjäna provision när du hjälper andra hitta bättre elavtal.',
  alternates: { canonical: '/affiliate' },
  openGraph: {
    title: 'Bli partner med Elchef – affiliateprogram',
    description:
      'Anslut dig till Elchefs partnerprogram och tjäna provision när du hjälper andra hitta bättre elavtal.',
    url: 'https://www.elchef.se/affiliate',
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

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
