import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elchef – gör det enkelt att välja rätt elavtal',
  description: 'Elchef.se hjälper dig att snabbt, gratis och utan krångel hitta och byta till det elavtal som passar dig bäst. Vi visar bara elavtal som är värda att överväga och sköter hela bytet åt dig.',
  alternates: {
    canonical: '/robinhood',
  },
  openGraph: {
    title: 'Elchef – gör det enkelt att välja rätt elavtal',
    description: 'Elchef.se hjälper dig att snabbt, gratis och utan krångel hitta och byta till det elavtal som passar dig bäst. Vi visar bara elavtal som är värda att överväga och sköter hela bytet åt dig.',
    url: 'https://www.elchef.se/robinhood',
    siteName: 'Elchef',
    images: [
      {
        url: 'https://www.elchef.se/elchef-logo.png',
        width: 1200,
        height: 630,
        alt: 'Elchef Logo',
      },
    ],
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elchef – gör det enkelt att välja rätt elavtal',
    description: 'Elchef.se hjälper dig att snabbt, gratis och utan krångel hitta och byta till det elavtal som passar dig bäst.',
    images: ['https://www.elchef.se/elchef-logo.png'],
  },
};

export default function RobinhoodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
