export const SITE_URL = 'https://www.elchef.se';

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Elchef',
  url: SITE_URL,
  description:
    'Jämför och byt elavtal i Sverige. Elchef.se hjälper dig hitta bättre elpriser med AI-fakturaanalys och enkelt byte av elleverantör.',
  publisher: {
    '@type': 'Organization',
    name: 'Elchef',
    url: SITE_URL,
  },
};

export function serviceJsonLd(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    url: `${SITE_URL}${options.path}`,
    provider: {
      '@type': 'Organization',
      name: 'Elchef',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Sweden',
    },
  };
}
