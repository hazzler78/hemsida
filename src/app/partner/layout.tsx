import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner med Elchef.se',
  description:
    'Bli partner till Elchef.se och hjälp fler hushåll och företag hitta bättre elavtal.',
  alternates: { canonical: '/partner' },
  openGraph: {
    title: 'Partner med Elchef.se',
    description:
      'Bli partner till Elchef.se och hjälp fler hushåll och företag hitta bättre elavtal.',
    url: 'https://www.elchef.se/partner',
  },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
