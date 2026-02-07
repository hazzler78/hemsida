import { NextResponse } from 'next/server';

/** Kända prisfiler: leverantörsnamn + URL. aliases = extra nycklar (t.ex. "Motala Energi") så att båda namnen matchar. */
const PRICE_SOURCES: { name: string; url: string; aliases?: string[] }[] = [
  { name: 'Cheap Energy', url: 'https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json' },
  { name: 'Energi2', url: 'https://energi2.se/Site_Priser_Energi2_de2.json' },
  { name: 'Stockholms Elbolag', url: 'https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json' },
  { name: 'Svealands Elbolag', url: 'https://elify.se/Site_Priser_SvealandsEL_de2.json' },
  { name: 'Svekraft', url: 'https://svekraft.com/Site_Priser_Svekraft_de2.json' },
  { name: 'Motala', url: 'https://elify.se/Site_Priser_Motala_de2.json', aliases: ['Motala Energi'] },
];

type NoCommitment = {
  surcharge?: number;
  monthly_fee?: number;
  variable_costs?: number;
  el_certificate_fee?: number;
  /** Rabatt 12-månadersavtal (öre/kWh) */
  '12_month_discount'?: number;
};

type FixedFees = {
  all_customers?: number;
  all_customers_discount?: number;
};

type ConsumptionSegment = {
  minConsumption?: number;
  maxConsumption?: number;
  no_commitment?: NoCommitment;
};

/** Hittar rätt förbrukningsintervall (segment) – priset skiljer sig per årsförbrukning. */
function findSegmentForConsumption(segments: ConsumptionSegment[] | undefined, consumptionKwhPerYear: number): ConsumptionSegment | undefined {
  if (!segments?.length) return undefined;
  const withRange = segments.filter((s) => s.minConsumption !== undefined && s.maxConsumption !== undefined);
  if (withRange.length === 0) return segments[0];
  const match = withRange.find((s) => consumptionKwhPerYear >= (s.minConsumption ?? 0) && consumptionKwhPerYear <= (s.maxConsumption ?? Infinity));
  return match ?? withRange[withRange.length - 1];
}

type ExtractedOption = { monthly_fee_kr: number; surcharge_ore_per_kwh: number };
export type RateType = 'hourly' | 'monthly';
type ExtractedWithRate = ExtractedOption & { rate_type: RateType };

/**
 * Påslag (öre/kWh). Om prisfilen har både total och price (spot) används total - price
 * (stämmer t.ex. för Cheap Energy). Annars: surcharge + variable_costs + el_certificate_fee - 12_month_discount.
 */
function extractOptionFromSegment(
  segment: ConsumptionSegment | undefined,
  fixedFees: FixedFees | undefined
): ExtractedOption | null {
  const nc = segment?.no_commitment as (NoCommitment & { total?: number; price?: number }) | undefined;
  if (!nc) return null;
  let surchargeOrePerKwh: number;
  if (typeof nc.total === 'number' && typeof nc.price === 'number') {
    surchargeOrePerKwh = nc.total - nc.price;
  } else {
    const surcharge = nc.surcharge ?? 0;
    const variable_costs = nc.variable_costs ?? 0;
    const el_certificate_fee = nc.el_certificate_fee ?? 0;
    const twelveMonthDiscount = nc['12_month_discount'] ?? 0;
    const hasAnyComponent =
      nc.surcharge !== undefined ||
      nc.variable_costs !== undefined ||
      nc.el_certificate_fee !== undefined ||
      nc['12_month_discount'] !== undefined;
    if (!hasAnyComponent) return null;
    surchargeOrePerKwh = surcharge + variable_costs + el_certificate_fee - twelveMonthDiscount;
  }
  let monthly_fee: number | undefined = nc.monthly_fee;
  if (monthly_fee === undefined && fixedFees) {
    const base = fixedFees.all_customers ?? 0;
    const discount = fixedFees.all_customers_discount ?? 0;
    monthly_fee = Math.max(0, base + discount);
  }
  return {
    monthly_fee_kr: monthly_fee !== undefined ? Math.round(monthly_fee) : 0,
    surcharge_ore_per_kwh: Math.round(surchargeOrePerKwh * 100) / 100,
  };
}

/** Årskostnad (SEK) för rörligt avtal: 12 * månad + påslag * kWh/år / 100. */
function annualCostKr(opt: ExtractedOption, consumptionKwhPerYear: number): number {
  return opt.monthly_fee_kr * 12 + (opt.surcharge_ore_per_kwh * consumptionKwhPerYear) / 100;
}

/**
 * Extraherar månadskostnad och påslag från prisfil. Tar alltid det billigaste av
 * variable_hourly_rate och variable_monthly_rate (lägst årskostnad för vald förbrukning).
 * Vid lika årskostnad väljs alltid Rörligt timpris (hourly).
 */
function extractFromPriceFile(
  data: unknown,
  area: string = 'se3',
  consumptionKwhPerYear: number = 5000
): ExtractedWithRate | null {
  try {
    const d = data as {
      variable_hourly_rate?: Record<string, ConsumptionSegment[]>;
      variable_monthly_rate?: Record<string, ConsumptionSegment[]>;
      fixed_fees?: FixedFees;
    };
    const segmentsHourly = d?.variable_hourly_rate?.[area];
    const segmentsMonthly = d?.variable_monthly_rate?.[area];
    const segmentHourly = findSegmentForConsumption(segmentsHourly, consumptionKwhPerYear);
    const segmentMonthly = findSegmentForConsumption(segmentsMonthly, consumptionKwhPerYear);
    const optHourly = extractOptionFromSegment(segmentHourly, d?.fixed_fees);
    const optMonthly = extractOptionFromSegment(segmentMonthly, d?.fixed_fees);
    if (optHourly && optMonthly) {
      const costH = annualCostKr(optHourly, consumptionKwhPerYear);
      const costM = annualCostKr(optMonthly, consumptionKwhPerYear);
      const useHourly = costH <= costM;
      return {
        ...(useHourly ? optHourly : optMonthly),
        rate_type: useHourly ? 'hourly' : 'monthly',
      };
    }
    if (optHourly) return { ...optHourly, rate_type: 'hourly' };
    if (optMonthly) return { ...optMonthly, rate_type: 'monthly' };
    return null;
  } catch {
    return null;
  }
}

export interface ProviderPriceItem {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
  /** 'hourly' = Rörligt timpris, 'monthly' = Rörligt månadspris */
  rate_type: RateType;
}

export type ProviderPricesResponse = {
  providers: Record<string, ProviderPriceItem>;
};

const REVALIDATE_SECONDS = 900; // 15 min – påslag kan vara negativt och ändras ofta

/** Intervall enligt prisfilerna (kWh/år). Samma svar cachelagras per intervall. */
function normalizeConsumption(kwhPerYear: number): number {
  const n = Math.max(0, Math.round(kwhPerYear));
  if (n < 5000) return 2500;
  if (n < 10000) return 7500;
  if (n < 17000) return 13500;
  return 25000;
}

const VALID_AREAS = ['se1', 'se2', 'se3', 'se4'] as const;
function normalizeArea(area: string | null): (typeof VALID_AREAS)[number] {
  const a = (area || 'se3').toLowerCase();
  return VALID_AREAS.includes(a as (typeof VALID_AREAS)[number]) ? (a as (typeof VALID_AREAS)[number]) : 'se3';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = normalizeArea(searchParams.get('area'));
  const consumptionParam = searchParams.get('consumption');
  const consumptionKwhPerYear = consumptionParam ? normalizeConsumption(Number(consumptionParam)) : 13500;

  const results = await Promise.all(
    PRICE_SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          next: { revalidate: REVALIDATE_SECONDS },
          headers: { Accept: 'application/json', 'User-Agent': 'Elchef-Price-Providers/1.0' },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { source, extracted: extractFromPriceFile(data, area, consumptionKwhPerYear) };
      } catch {
        return null;
      }
    })
  );

  const providers: Record<string, ProviderPriceItem> = {};
  for (const row of results) {
    if (!row?.extracted) continue;
    const { source, extracted } = row;
    providers[source.name] = extracted;
    for (const alias of source.aliases ?? []) {
      providers[alias] = extracted;
    }
  }

  return NextResponse.json({ providers } as ProviderPricesResponse, {
    headers: {
      'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}

export const runtime = 'edge';
