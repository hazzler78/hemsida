import Script from 'next/script';

type Props = {
  id: string;
  data: Record<string, unknown>;
};

export default function JsonLd({ id, data }: Props) {
  return (
    <Script id={id} type="application/ld+json">
      {JSON.stringify(data)}
    </Script>
  );
}
