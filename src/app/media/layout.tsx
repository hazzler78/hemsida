import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elchef i media – Nyheter och analyser om elmarknaden',
  description:
    'Läs Elchefs senaste artiklar, nyheter och analyser om elpriser, energibesparing och elavtal i Sverige. Vi spårar elmarknaden och sprider kunskap om hållbara elavtal.',
  keywords:
    'elchef media, elnyheter, elmarknad Sverige, elpriser, energibesparing, elavtal, elkonsument',
  alternates: {
    canonical: '/media',
  },
  openGraph: {
    title: 'Elchef i media – Nyheter och analyser om elmarknaden',
    description:
      'Läs Elchefs senaste artiklar och analyser om elpriser, energibesparing och elavtal i Sverige.',
    url: 'https://www.elchef.se/media',
  },
};

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
