/** Experiment: konverteringsförbättringar på /rorligt-avtal-v2 (jul 2026). */

export const CONVERSION_EXPERIMENT = {
  id: 'conv_skip_featured_2026_07',
  name: 'Snabbare väg till affiliate-klick',
  description:
    'Hoppa över-frågor, ett featured avtal, färre val, popup-säker affiliate-öppning, all trafik till v2.',
  changes: [
    'Hoppa över preferensfrågor → se avtal direkt',
    'Ett rekommenderat avtal först; övriga bakom "Visa fler"',
    'Fastpris som länk istället för extra grid',
    'Affiliate-öppning med fallback om popup blockeras',
    'Redirect /rorligt-avtal → /rorligt-avtal-v2',
  ],
  /** Sätts när ni klickar "Markera live" i admin (eller när PR mergas till prod). */
  defaultWindowDays: 14 as const,
} as const;

export type ConversionExperimentId = typeof CONVERSION_EXPERIMENT.id;

export type ConversionMetrics = {
  windowDays: number;
  from: string;
  to: string;
  homepageViews: number;
  heroClicks: number;
  contractPageViews: number;
  affiliateClicks: number;
  affiliateClicksV2: number;
  /** Affiliate-klick / avtalssidevisningar (%) */
  contractToAffiliateRate: number | null;
  /** Affiliate-klick / startsidavisningar (%) */
  homepageToAffiliateRate: number | null;
  /** Hero-klick / startsidavisningar (%) */
  homepageToHeroRate: number | null;
};

export type ConversionSnapshotRow = {
  id?: number;
  experiment_id: string;
  kind: 'baseline' | 'checkpoint' | 'live_start';
  label: string;
  window_days: number;
  period_from: string;
  period_to: string;
  metrics: ConversionMetrics;
  notes: string | null;
  created_at?: string;
};

export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

export function formatRate(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export function deltaLabel(before: number | null, after: number | null): string {
  if (before === null || after === null) return '—';
  const d = after - before;
  const sign = d > 0 ? '+' : '';
  return `${sign}${d.toFixed(1)} pp`;
}

export function isoDaysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}
