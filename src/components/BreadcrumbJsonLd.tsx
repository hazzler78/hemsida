import Script from 'next/script';
import { breadcrumbJsonLd, type BreadcrumbItem } from '@/lib/seo';

type Props = {
  id: string;
  items: BreadcrumbItem[];
};

export default function BreadcrumbJsonLd({ id, items }: Props) {
  return (
    <Script id={id} type="application/ld+json">
      {JSON.stringify(breadcrumbJsonLd(items))}
    </Script>
  );
}
