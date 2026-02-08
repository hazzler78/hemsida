import { NextResponse } from 'next/server';

const PRICE_SOURCES: { name: string; url: string; aliases?: string[] }[] = [
  { name: 'Cheap Energy', url: 'https://cheapenergy.se/Site_Priser_CheapEnergy_de2.json' },
  { name: 'Energi2', url: 'https://energi2.se/Site_Priser_Energi2_de2.json' },
  { name: 'Stockholms Elbolag', url: 'https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json' },
  { name: 'Svealands Elbolag', url: 'https://elify.se/Site_Priser_SvealandsEL_de2.json' },
  { name: 'Svekraft', url: 'https://svekraft.com/Site_Priser_Svekraft_de2.json' },
  { name: 'Motala', url: 'https://elify.se/Site_Priser_Motala_de2.json', aliases: ['Motala Energi'] },
];

type FixedPeriodKey = '3_months' | '6_months' | '9_months' | '1_year' | '2_years' | '3_years' | '4_years' | '5_years' | '6_years' | '7_years' | '8_years' | '9_years' | '10_years';
const VALID_PERIODS: FixedPeriodKey[] = ['3_months', '6_months', '9_months', '1_year', '2_years', '3_years', '4_years', '5_years', '6_years', '7_years', '8_years', '9_years', '10_years'];
const REVALIDATE_SECONDS = 900;

function extractFixedPrice(
  data: unknown,
  area: string,
  period: FixedPeriodKey
): number | null {
  try {
    const d = data as {
      variable_fixed_prices?: Record<
        string,
        Record<string, number | { price?: number; total_with_vat?: number }>
      >;
    };
    const areaPrices = d?.variable_fixed_prices?.[area];
    const raw = areaPrices?.[period];
    if (raw == null) return null;
    if (typeof raw === 'number') {
      return Math.round(raw * 1.25 * 10) / 10;
    }
    const obj = raw as { total_with_vat?: number; price?: number };
    if (typeof obj.total_with_vat === 'number') return Math.round(obj.total_with_vat * 10) / 10;
    if (typeof obj.price === 'number') return Math.round(obj.price * 1.25 * 10) / 10;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = (searchParams.get('area') || 'se3').toLowerCase();
  const period = (searchParams.get('period') || '1_year') as FixedPeriodKey;
  const validArea = ['se1', 'se2', 'se3', 'se4'].includes(area) ? area : 'se3';
  const validPeriod = VALID_PERIODS.includes(period) ? period : '1_year';

  const results = await Promise.all(
    PRICE_SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          next: { revalidate: REVALIDATE_SECONDS },
          headers: { Accept: 'application/json', 'User-Agent': 'Elchef-Price-Providers-Fixed/1.0' },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const price = extractFixedPrice(data, validArea, validPeriod);
        return price !== null ? { source, price } : null;
      } catch {
        return null;
      }
    })
  );

  const providers: Record<string, number> = {};
  for (const row of results) {
    if (!row) continue;
    const { source, price } = row;
    providers[source.name] = price;
    for (const alias of source.aliases ?? []) {
      providers[alias] = price;
    }
  }

  return NextResponse.json({ providers }, {
    headers: {
      'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}

export const runtime = 'edge';
