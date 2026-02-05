import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kunskap om elavtal och elpriser | Elchef.se',
  description:
    'Förstå elavtal, elpriser och spotpris på el. Guider om bästa elavtal 2026, hur du sänker elräkningen och vad som påverkar elpriset i Sverige.',
  openGraph: {
    title: 'Kunskap om elavtal och elpriser | Elchef.se',
    description:
      'Förstå elavtal, elpriser och spotpris på el. Guider om bästa elavtal 2026, hur du sänker elräkningen och vad som påverkar elpriset i Sverige.',
    url: 'https://www.elchef.se/kunskap',
  },
};

export default function KunskapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

