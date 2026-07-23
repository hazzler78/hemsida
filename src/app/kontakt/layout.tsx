import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakta oss | Elchef.se',
  description:
    'Har du frågor om elavtal, elpriser eller byte av elleverantör? Kontakta Elchef.se – vi hjälper dig gärna.',
  alternates: { canonical: '/kontakt' },
  openGraph: {
    title: 'Kontakta oss | Elchef.se',
    description:
      'Har du frågor om elavtal, elpriser eller byte av elleverantör? Kontakta Elchef.se – vi hjälper dig gärna.',
    url: 'https://www.elchef.se/kontakt',
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

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
