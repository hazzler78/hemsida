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

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
