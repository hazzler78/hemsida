import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elavtal för företag – jämför och byt | Elchef.se',
  description:
    'Hitta bättre elavtal för ditt företag. Elchef.se hjälper dig jämföra elpriser och byta elleverantör snabbt och utan krångel.',
  alternates: { canonical: '/foretag' },
  openGraph: {
    title: 'Elavtal för företag – jämför och byt | Elchef.se',
    description:
      'Hitta bättre elavtal för ditt företag. Elchef.se hjälper dig jämföra elpriser och byta elleverantör snabbt och utan krångel.',
    url: 'https://www.elchef.se/foretag',
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

export default function ForetagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
