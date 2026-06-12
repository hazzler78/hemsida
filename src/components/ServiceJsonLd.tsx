import JsonLd from '@/components/JsonLd';
import { serviceJsonLd } from '@/lib/seo';

type Props = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export default function ServiceJsonLd({ id, name, description, path }: Props) {
  return <JsonLd id={id} data={serviceJsonLd({ name, description, path })} />;
}
