import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jämför elpriser och elavtal i Sverige med AI | Elchef.se',
  description:
    'Ladda upp din elräkning och jämför elavtal i Sverige med AI. Få uppskattad besparing och hjälp att hitta bästa elavtal 2026 för din förbrukning och ditt elområde.',
  alternates: {
    canonical: '/fakturaanalys',
  },
  openGraph: {
    title: 'Jämför elpriser och elavtal i Sverige med AI | Elchef.se',
    description:
      'Ladda upp din elräkning och jämför elavtal i Sverige med AI. Få uppskattad besparing och hjälp att hitta bästa elavtal 2026 för din förbrukning och ditt elområde.',
    url: 'https://www.elchef.se/jamfor-elpriser',
  },
};

export default function JamforElpriserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

