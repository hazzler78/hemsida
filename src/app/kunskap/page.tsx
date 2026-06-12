import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import KunskapClient from './KunskapClient';

export default function KunskapIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        id="breadcrumb-kunskap"
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Kunskap', path: '/kunskap' },
        ]}
      />
      <KunskapClient />
    </>
  );
}
