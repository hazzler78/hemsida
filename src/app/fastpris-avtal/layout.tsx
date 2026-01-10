import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fastprisavtal - Välj din leverantör | Elchef.se',
  description: 'Välj bland de bästa leverantörerna för fastprisavtal. Jämför erbjudanden och hitta det fastprisavtalet som passar dig bäst.',
  openGraph: {
    title: 'Fastprisavtal - Välj din leverantör | Elchef.se',
    description: 'Välj bland de bästa leverantörerna för fastprisavtal. Jämför erbjudanden och hitta det fastprisavtalet som passar dig bäst.',
    url: 'https://www.elchef.se/fastpris-avtal',
  },
};

export default function FastprisAvtalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
