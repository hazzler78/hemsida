import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Användarvillkor | Elchef.se',
  description:
    'Läs användarvillkoren för Elchef.se – villkor för vår tjänst att jämföra och förmedla elavtal till konsumenter i Sverige.',
  alternates: { canonical: '/villkor' },
  openGraph: {
    title: 'Användarvillkor | Elchef.se',
    description:
      'Läs användarvillkoren för Elchef.se – villkor för vår tjänst att jämföra och förmedla elavtal till konsumenter i Sverige.',
    url: 'https://www.elchef.se/villkor',
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

export default function VillkorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
