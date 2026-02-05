import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rörligt elavtal – jämför bästa rörliga elavtal 2026 | Elchef.se',
  description:
    'Jämför rörliga elavtal i Sverige, se påslag och månadsavgifter och hitta bästa rörliga elavtal 2026 för din ekonomi i elområden som SE3 och SE4.',
  openGraph: {
    title: 'Rörligt elavtal – jämför bästa rörliga elavtal 2026 | Elchef.se',
    description:
      'Jämför rörliga elavtal i Sverige, se påslag och månadsavgifter och hitta bästa rörliga elavtal 2026 för din ekonomi i elområden som SE3 och SE4.',
    url: 'https://www.elchef.se/rorligt-avtal',
  },
};

export default function RorligtAvtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
