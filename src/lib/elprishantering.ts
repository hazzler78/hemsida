import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import type { CheapEnergyPrices } from '@/lib/types';

declare global {
  interface CloudflareEnv {
    ELPRISHANTERING_API_KEY?: string;
  }
}

const API_BASE = 'https://elprishantering.com';

export const REVALIDATE_SECONDS = 900;

/** Bolag som elchef.se visar. Föreningsel väntar. */
export const PRICE_PARTNERS: { slug: string; name: string; aliases?: string[] }[] = [
  { slug: 'cheapenergy', name: 'Cheap Energy' },
  { slug: 'energi2', name: 'Energi2' },
  { slug: 'sthlmsel', name: 'Stockholms Elbolag' },
  { slug: 'svealandsel', name: 'Svealands Elbolag' },
  { slug: 'svekraft', name: 'Svekraft' },
  { slug: 'motala', name: 'Motala', aliases: ['Motala Energi'] },
];

const AREAS = ['se1', 'se2', 'se3', 'se4'] as const;

export type FixedPeriodKey =
  | '3_months'
  | '6_months'
  | '9_months'
  | '1_year'
  | '2_years'
  | '3_years'
  | '4_years'
  | '5_years'
  | '6_years'
  | '7_years'
  | '8_years'
  | '9_years'
  | '10_years';

const MONTHS_TO_PERIOD: Record<number, FixedPeriodKey> = {
  3: '3_months',
  6: '6_months',
  9: '9_months',
  12: '1_year',
  24: '2_years',
  36: '3_years',
  48: '4_years',
  60: '5_years',
  72: '6_years',
  84: '7_years',
  96: '8_years',
  108: '9_years',
  120: '10_years',
};

export type RateType = 'hourly' | 'monthly' | 'quarterly';

export interface VariableOffer {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
  rate_type: RateType;
}

type PriceComponents = {
  monthly_fee?: number | null;
  fixed_price?: number | null;
};

type PriceBreakdown = {
  energy_price_excl_vat?: number;
  total_price?: number;
};

type AreaProduct = {
  supplier?: string;
  type?: string;
  include_vat?: boolean;
  binding_period_months?: number | null;
  components?: PriceComponents;
  breakdown?: PriceBreakdown;
};

type AreaPricesResponse = {
  spot_price?: { ore_kwh?: number };
  products?: AreaProduct[];
};

type SupplierAreaBlock = {
  components?: PriceComponents;
};

type SupplierProduct = {
  type?: string;
  binding_period_months?: number | null;
  per_area?: Record<string, SupplierAreaBlock>;
};

type SupplierPricesResponse = {
  spot_price?: { per_area?: Record<string, number> };
  products?: SupplierProduct[];
};

function apiKey(): string | undefined {
  const fromCloudflare = getOptionalRequestContext()?.env?.ELPRISHANTERING_API_KEY;
  if (fromCloudflare) return fromCloudflare;
  return process.env.ELPRISHANTERING_API_KEY;
}

async function elprisGet<T>(path: string): Promise<T> {
  const key = apiKey();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'Elchef-Price/2.0',
  };
  if (key) headers.Authorization = `Bearer ${key}`;
  else console.warn('ELPRISHANTERING_API_KEY saknas, anropar elprishantering utan nyckel');

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Elprishantering svarade ${response.status} på ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchAreaPrices(
  area: string,
  options: { consumptionKwh?: number; types?: string } = {}
): Promise<AreaPricesResponse> {
  const params = new URLSearchParams({
    price_area: area.toUpperCase(),
    supplier: PRICE_PARTNERS.map((partner) => partner.slug).join(','),
  });
  if (options.consumptionKwh != null) params.set('consumption_kwh', String(options.consumptionKwh));
  if (options.types) params.set('type', options.types);
  return elprisGet<AreaPricesResponse>(`/v2/prices?${params.toString()}`);
}

function rateTypeOf(type: string | undefined): RateType {
  if (type === 'monthly') return 'monthly';
  if (type === 'quarter_hourly') return 'quarterly';
  return 'hourly';
}

function annualCostKr(monthlyFee: number, surchargeOre: number, consumptionKwh: number): number {
  return monthlyFee * 12 + (surchargeOre * consumptionKwh) / 100;
}

function toVariableOffer(product: AreaProduct, spotOreExclVat: number): VariableOffer | null {
  const energy = product.breakdown?.energy_price_excl_vat;
  if (typeof energy !== 'number' || !Number.isFinite(energy)) return null;
  return {
    monthly_fee_kr: Math.round(product.components?.monthly_fee ?? 0),
    surcharge_ore_per_kwh: Math.round((energy - spotOreExclVat) * 100) / 100,
    rate_type: rateTypeOf(product.type),
  };
}

/**
 * Billigaste obundna rörliga avtalet. Kvartspris (annars timpris) jämförs med månadspris.
 * Vid lika årskostnad vinner kvartspris/timpris, samma som tidigare prisfiler.
 */
export function variableOfferForSupplier(
  products: AreaProduct[] | undefined,
  slug: string,
  spotOreExclVat: number,
  consumptionKwh: number
): VariableOffer | null {
  const unbound = (products ?? []).filter(
    (product) => product.supplier === slug && (product.binding_period_months ?? 0) === 0
  );
  const quarterly = unbound.filter((product) => product.type === 'quarter_hourly');
  const hourly = unbound.filter((product) => product.type === 'hourly');
  const monthly = unbound.filter((product) => product.type === 'monthly');
  const spotFollowing = quarterly.length > 0 ? quarterly : hourly;

  const cheapest = (list: AreaProduct[]): { offer: VariableOffer; cost: number } | null => {
    let best: { offer: VariableOffer; cost: number } | null = null;
    for (const product of list) {
      const offer = toVariableOffer(product, spotOreExclVat);
      if (!offer) continue;
      const cost = annualCostKr(offer.monthly_fee_kr, offer.surcharge_ore_per_kwh, consumptionKwh);
      if (!best || cost < best.cost) best = { offer, cost };
    }
    return best;
  };

  const spotOffer = cheapest(spotFollowing);
  const monthOffer = cheapest(monthly);
  if (spotOffer && monthOffer) return spotOffer.cost <= monthOffer.cost ? spotOffer.offer : monthOffer.offer;
  return spotOffer?.offer ?? monthOffer?.offer ?? null;
}

/** Fastpris i öre/kWh inkl. moms, samma avrundning som den tidigare prisfilen. */
export function fixedInclVatOre(product: AreaProduct): number | null {
  const stored = product.components?.fixed_price;
  const energy = typeof stored === 'number' ? stored : product.breakdown?.energy_price_excl_vat;
  if (typeof energy !== 'number' || !Number.isFinite(energy)) return null;
  if (product.include_vat === false) return Math.round(energy * 1.25 * 10) / 10;
  const total = product.breakdown?.total_price;
  if (typeof total === 'number' && Number.isFinite(total)) return Math.round(total * 10) / 10;
  return Math.round(energy * 1.25 * 10) / 10;
}

export function fixedPriceForPeriod(
  products: AreaProduct[] | undefined,
  slug: string,
  period: FixedPeriodKey
): number | null {
  const match = (products ?? []).find(
    (product) =>
      product.supplier === slug &&
      product.type === 'fixed' &&
      MONTHS_TO_PERIOD[product.binding_period_months ?? -1] === period
  );
  return match ? fixedInclVatOre(match) : null;
}

/** Spot och fastpris för alla elområden, i den form hero-widgeten redan läser. */
export async function fetchStockholmPrices(): Promise<CheapEnergyPrices> {
  const data = await elprisGet<SupplierPricesResponse>('/v2/prices/sthlmsel');
  const spot_prices: CheapEnergyPrices['spot_prices'] = {};
  const variable_fixed_prices: CheapEnergyPrices['variable_fixed_prices'] = {};
  let monthlyFee = 0;

  for (const area of AREAS) {
    const upper = area.toUpperCase();
    const spot = data.spot_price?.per_area?.[upper];
    if (typeof spot === 'number' && Number.isFinite(spot)) {
      spot_prices[area] = Math.round(spot * 100) / 100;
    }

    const periods: CheapEnergyPrices['variable_fixed_prices'][string] = {
      '3_months': { price: undefined },
      '6_months': { price: undefined },
      '9_months': { price: undefined },
      '1_year': { price: undefined },
      '2_years': { price: undefined },
      '3_years': { price: undefined },
      '4_years': { price: undefined },
      '5_years': { price: undefined },
      '6_years': { price: undefined },
      '7_years': { price: undefined },
      '8_years': { price: undefined },
      '9_years': { price: undefined },
      '10_years': { price: undefined },
    };

    for (const product of data.products ?? []) {
      if (product.type !== 'fixed') continue;
      const period = MONTHS_TO_PERIOD[product.binding_period_months ?? -1];
      if (!period) continue;
      const block = product.per_area?.[upper];
      const price = block?.components?.fixed_price;
      if (typeof price !== 'number' || !Number.isFinite(price)) continue;
      periods[period] = { price: Math.round(price * 100) / 100 };
      if (area === 'se3' && typeof block?.components?.monthly_fee === 'number') {
        monthlyFee = Math.round(block.components.monthly_fee);
      }
    }

    variable_fixed_prices[area] = periods;
  }

  return {
    spot_prices,
    variable_fixed_prices,
    fixed_fees: {
      all_customers: monthlyFee,
      green_electricity: 0,
    },
  };
}
