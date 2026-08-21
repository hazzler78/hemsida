import { getAttributionUtm, withUtm } from '@/lib/utm';

export const FA_PREFILL_KEY = 'elchef_fa_prefill_v1';

export type FaContractPrefill = {
  annualUsage?: number;
  postalCode?: string;
  currentProvider?: string;
  priority?: 'price' | 'security' | 'flexibility';
  source?: string;
};

/** Best-effort parse of OCR markdown for prefill. */
export function parseInvoiceHints(text: string): FaContractPrefill {
  if (!text) return {};
  const t = text.replace(/\u00a0/g, ' ');
  const out: FaContractPrefill = {};

  // Annual kWh: "12 450 kWh/år", "årsförbrukning: 8000", "förbrukning 8 000 kWh per år"
  const annualPatterns = [
    /årsförbrukning[^0-9]{0,20}(\d{1,3}(?:[\s ]\d{3})*|\d{3,6})\s*kwh/i,
    /(\d{1,3}(?:[\s ]\d{3})*|\d{3,6})\s*kwh\s*\/\s*år/i,
    /(\d{1,3}(?:[\s ]\d{3})*|\d{3,6})\s*kwh\s*per\s*år/i,
    /förbrukning[^0-9]{0,24}(\d{1,3}(?:[\s ]\d{3})*|\d{3,6})\s*kwh(?!\s*\/\s*mån)/i,
  ];
  for (const re of annualPatterns) {
    const m = t.match(re);
    if (m?.[1]) {
      const n = parseInt(m[1].replace(/\s/g, ''), 10);
      if (n >= 500 && n <= 80000) {
        out.annualUsage = n;
        break;
      }
    }
  }

  // Monthly kWh → estimate year (only if no annual)
  if (!out.annualUsage) {
    const m = t.match(/(\d{2,5})\s*kwh\s*\/\s*mån/i) || t.match(/månadsförbrukning[^0-9]{0,16}(\d{2,5})/i);
    if (m?.[1]) {
      const monthly = parseInt(m[1].replace(/\s/g, ''), 10);
      if (monthly >= 50 && monthly <= 5000) out.annualUsage = monthly * 12;
    }
  }

  // Postal code SE
  const p = t.match(/\b([1-9]\d{2}\s?\d{2})\b/);
  if (p?.[1]) {
    const digits = p[1].replace(/\s/g, '');
    if (digits.length === 5) out.postalCode = digits;
  }

  // Current provider (common names)
  const providers = [
    'Cheap Energy',
    'Svealands Elbolag',
    'Stockholms Elbolag',
    'Svekraft',
    'Tibber',
    'Fortum',
    'Vattenfall',
    'E.ON',
    'EON',
    'Greenely',
    'Bixia',
    'Skellefteå Kraft',
    'Göteborg Energi',
  ];
  const lower = t.toLowerCase();
  for (const name of providers) {
    if (lower.includes(name.toLowerCase())) {
      out.currentProvider = name === 'EON' ? 'E.ON' : name;
      break;
    }
  }

  out.priority = 'price';
  return out;
}

export function saveFaPrefill(prefill: FaContractPrefill): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      FA_PREFILL_KEY,
      JSON.stringify({ ...prefill, source: prefill.source || 'fakturaanalys', savedAt: Date.now() }),
    );
  } catch {
    /* private mode */
  }
}

export function loadFaPrefill(): FaContractPrefill | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FA_PREFILL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FaContractPrefill & { savedAt?: number };
    // 2h TTL
    if (data.savedAt && Date.now() - data.savedAt > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(FA_PREFILL_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * CTA from fakturaanalys → rörligt with skip + optional usage/postal.
 * Keeps first-touch UTM when present.
 */
export function buildRorligtHrefFromFa(extra?: FaContractPrefill): string {
  const landing = typeof window !== 'undefined' ? getAttributionUtm() : {};
  const prefill = { ...(typeof window !== 'undefined' ? loadFaPrefill() || {} : {}), ...extra };

  const params = new URLSearchParams();
  params.set('skip', '1');
  params.set('from', 'fakturaanalys');
  if (prefill.annualUsage && prefill.annualUsage > 0) {
    params.set('usage', String(prefill.annualUsage));
  }
  if (prefill.postalCode) params.set('postal', prefill.postalCode.replace(/\D/g, '').slice(0, 5));
  if (prefill.priority) params.set('priority', prefill.priority);
  if (prefill.currentProvider) params.set('provider', prefill.currentProvider);

  const path = `/rorligt-avtal-v2?${params.toString()}`;
  return withUtm(path, {
    utm_source: landing.utm_source || 'fakturaanalys',
    utm_medium: landing.utm_medium || 'fakturaanalys',
    utm_campaign: landing.utm_campaign || 'fa_to_rorligt',
    utm_content: landing.utm_content || 'cta-rorligt',
  });
}

export function shouldSkipQuestionsForContract(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('skip') === '1') return true;
    if (params.get('from') === 'fakturaanalys') return true;
    if (params.get('usage')) return true;

    const utm = getAttributionUtm();
    const medium = (utm.utm_medium || '').toLowerCase();
    const source = (utm.utm_source || '').toLowerCase();
    if (medium === 'reel' || medium === 'reels' || medium === 'bio' || medium === 'social') return true;
    if (medium === 'fakturaanalys' || source === 'fakturaanalys') return true;
    if (medium === 'skip_ocr') return true;

    if (loadFaPrefill()) return true;

    return false;
  } catch {
    return false;
  }
}
