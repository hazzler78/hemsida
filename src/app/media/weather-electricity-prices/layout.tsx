import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Så påverkar vädret elpriset | Elchef i media',
  description:
    'Förklaring av hur väder, vind och temperatur påverkar elpriset – och vad du kan göra åt det.',
  alternates: { canonical: '/media/weather-electricity-prices' },
  openGraph: {
    title: 'Så påverkar vädret elpriset | Elchef i media',
    description:
      'Förklaring av hur väder, vind och temperatur påverkar elpriset – och vad du kan göra åt det.',
    url: 'https://www.elchef.se/media/weather-electricity-prices',
  },
};

export default function WeatherElectricityPricesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
