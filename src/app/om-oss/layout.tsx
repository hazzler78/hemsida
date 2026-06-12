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
  },
};

export default function OmOssLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
