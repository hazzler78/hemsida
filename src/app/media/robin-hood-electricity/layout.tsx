import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elens Robin Hood vill ha billigare el åt folket | Elchef i media',
  description:
    'Elchef.se i Hallandsposten – om att göra elmarknaden mer rättvis och ge billigare el åt alla.',
  alternates: { canonical: '/media/robin-hood-electricity' },
  openGraph: {
    title: 'Elens Robin Hood vill ha billigare el åt folket | Elchef i media',
    description:
      'Elchef.se i Hallandsposten – om att göra elmarknaden mer rättvis och ge billigare el åt alla.',
    url: 'https://www.elchef.se/media/robin-hood-electricity',
  },
};

export default function RobinHoodElectricityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
