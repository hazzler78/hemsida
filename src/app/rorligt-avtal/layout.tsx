import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rörligt avtal - Välj din leverantör | Elchef.se',
  description: 'Välj bland de bästa leverantörerna för rörliga elavtal. Jämför erbjudanden och hitta det rörliga avtalet som passar dig bäst.',
  openGraph: {
    title: 'Rörligt avtal - Välj din leverantör | Elchef.se',
    description: 'Välj bland de bästa leverantörerna för rörliga elavtal. Jämför erbjudanden och hitta det rörliga avtalet som passar dig bäst.',
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
