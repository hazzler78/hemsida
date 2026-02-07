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

/** Extraherar månadskostnad (kr) och påslag (öre/kWh) från en prisfils-JSON. Påslag kan vara negativt. */
function extractFromPriceFile(
  data: unknown,
  area: string = 'se3',
  consumptionKwhPerYear: number = 5000
): { monthly_fee_kr: number; surcharge_ore_per_kwh: number } | null {
  try {
    const d = data as {
      variable_hourly_rate?: Record<string, ConsumptionSegment[]>;
      variable_monthly_rate?: Record<string, ConsumptionSegment[]>;
      fixed_fees?: FixedFees;
    };
    const segmentsHourly = d?.variable_hourly_rate?.[area];
    const segmentsMonthly = d?.variable_monthly_rate?.[area];
    const segment = findSegmentForConsumption(segmentsHourly ?? segmentsMonthly, consumptionKwhPerYear);
    const nc = segment?.no_commitment;
    const surcharge = nc?.surcharge;
    let monthly_fee: number | undefined = nc?.monthly_fee;
    if (monthly_fee === undefined && d?.fixed_fees) {
      const base = d.fixed_fees.all_customers ?? 0;
      const discount = d.fixed_fees.all_customers_discount ?? 0;
      monthly_fee = Math.max(0, base + discount);
    }
    if (surcharge === undefined) return null;
    return {
      monthly_fee_kr: monthly_fee !== undefined ? Math.round(monthly_fee) : 0,
      surcharge_ore_per_kwh: Math.round(surcharge * 100) / 100,
    };
  } catch {
    return null;
  }
}

export interface ProviderPriceItem {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
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

export async function GET(request: Request) {
  const area = 'se3';
  const { searchParams } = new URL(request.url);
  const consumptionParam = searchParams.get('consumption');
  const consumptionKwhPerYear = consumptionParam ? normalizeConsumption(Number(consumptionParam)) : 5000;

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
