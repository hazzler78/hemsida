import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Om oss – Elchef.se',
  description:
    'Läs om Elchef.se – vi hjälper svenska hushåll och företag att hitta och byta till bättre elavtal, enkelt och tryggt.',
  alternates: { canonical: '/om-oss' },
  openGraph: {
    title: 'Om oss – Elchef.se',
    description:
      'Läs om Elchef.se – vi hjälper svenska hushåll och företag att hitta och byta till bättre elavtal, enkelt och tryggt.',
    url: 'https://www.elchef.se/om-oss',
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

export default function OmOssLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
