import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookiepolicy | Elchef.se',
  description:
    'Läs om hur Elchef.se använder cookies och liknande tekniker för att förbättra din upplevelse och mäta trafik.',
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookiepolicy | Elchef.se',
    description:
      'Läs om hur Elchef.se använder cookies och liknande tekniker för att förbättra din upplevelse och mäta trafik.',
    url: 'https://www.elchef.se/cookies',
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
