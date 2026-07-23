import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR | Elchef.se',
  description:
    'Information om hur Elchef.se följer GDPR och dina rättigheter kring personuppgifter.',
  alternates: { canonical: '/gdpr' },
  openGraph: {
    title: 'GDPR | Elchef.se',
    description:
      'Information om hur Elchef.se följer GDPR och dina rättigheter kring personuppgifter.',
    url: 'https://www.elchef.se/gdpr',
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

export default function GdprLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
