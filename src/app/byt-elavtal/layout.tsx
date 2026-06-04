import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Byt elavtal enkelt – jämför rörligt och fastpris | Elchef.se',
  description:
    'Byt elavtal enkelt online. Jämför rörligt elavtal och fastprisavtal och låt Elchef guida dig till det elavtal som passar din ekonomi och risknivå bäst.',
  alternates: {
    canonical: '/byt-elavtal',
  },
  openGraph: {
    title: 'Byt elavtal enkelt – jämför rörligt och fastpris | Elchef.se',
    description:
      'Byt elavtal enkelt online. Jämför rörligt elavtal och fastprisavtal och låt Elchef guida dig till det elavtal som passar din ekonomi och risknivå bäst.',
    url: 'https://www.elchef.se/byt-elavtal',
  },
};

export default function BytElavtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

