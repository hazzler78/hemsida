/** Startsida → hero-klick → avtalssida → affiliate (rörligt). */

export type HomepageFunnelStepId =
  | 'homepage'
  | 'hero_click'
  | 'contract_page'
  | 'affiliate';

export type HomepageFunnelStep = {
  id: HomepageFunnelStepId;
  label: string;
  description: string;
  count: number;
  /** Andel av föregående steg (null för första steget). */
  rateFromPrevious: number | null;
  /** Andel av startsidans besök. */
  rateFromStart: number | null;
};

export type HomepageFunnelStats = {
  homepageViews: number;
  heroImpressions: number;
  heroClicks: number;
  contractPageViews: number;
  affiliateRorligtClicks: number;
  steps: HomepageFunnelStep[];
};

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

export function buildHomepageFunnel(stats: {
  homepageViews: number;
  heroImpressions: number;
  heroClicks: number;
  contractPageViews: number;
  affiliateRorligtClicks: number;
}): HomepageFunnelStats {
  const { homepageViews, heroImpressions, heroClicks, contractPageViews, affiliateRorligtClicks } =
    stats;

  const rawSteps: Array<Omit<HomepageFunnelStep, 'rateFromPrevious' | 'rateFromStart'>> = [
    {
      id: 'homepage',
      label: 'Startsida',
      description: 'Besök på / (page_views, exkl. botar)',
      count: homepageViews,
    },
    {
      id: 'hero_click',
      label: 'Hero-klick',
      description: 'Klick på primär CTA (hero_clicks)',
      count: heroClicks,
    },
    {
      id: 'contract_page',
      label: 'Avtalssida',
      description: 'Besök på /rorligt-avtal-v2 eller /rorligt-avtal',
      count: contractPageViews,
    },
    {
      id: 'affiliate',
      label: 'Affiliate-klick',
      description: 'Klick till leverantör, rörligt avtal',
      count: affiliateRorligtClicks,
    },
  ];

  const steps: HomepageFunnelStep[] = rawSteps.map((step, index) => {
    const prevCount = index > 0 ? rawSteps[index - 1].count : 0;
    return {
      ...step,
      rateFromPrevious: index === 0 ? null : pct(step.count, prevCount),
      rateFromStart: pct(step.count, homepageViews),
    };
  });

  return {
    homepageViews,
    heroImpressions,
    heroClicks,
    contractPageViews,
    affiliateRorligtClicks,
    steps,
  };
}

export function formatFunnelRate(rate: number | null, digits = 1): string {
  if (rate === null) return '—';
  return `${rate.toFixed(digits)} %`;
}
