import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integritetspolicy | Elchef.se',
  description:
    'Läs hur Elchef.se behandlar dina personuppgifter när du jämför elavtal, laddar upp elräkningar eller kontaktar oss.',
  alternates: { canonical: '/integritetspolicy' },
  openGraph: {
    title: 'Integritetspolicy | Elchef.se',
    description:
      'Läs hur Elchef.se behandlar dina personuppgifter när du jämför elavtal, laddar upp elräkningar eller kontaktar oss.',
    url: 'https://www.elchef.se/integritetspolicy',
  },
};

export default function IntegritetspolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
