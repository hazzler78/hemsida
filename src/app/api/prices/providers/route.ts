import { NextResponse } from 'next/server';
import {
  fetchAreaPrices,
  PRICE_PARTNERS,
  REVALIDATE_SECONDS,
  variableOfferForSupplier,
  type VariableOffer,
} from '@/lib/elprishantering';

export type ProviderPriceItem = VariableOffer;

export type ProviderPricesResponse = {
  providers: Record<string, ProviderPriceItem>;
};

const VALID_AREAS = ['se1', 'se2', 'se3', 'se4'] as const;

function normalizeArea(area: string | null): (typeof VALID_AREAS)[number] {
  const value = (area || 'se3').toLowerCase();
  return VALID_AREAS.includes(value as (typeof VALID_AREAS)[number])
    ? (value as (typeof VALID_AREAS)[number])
    : 'se3';
}

/** Samma förbrukningsintervall som tidigare, så svaret kan cachelagras per steg. */
function normalizeConsumption(kwhPerYear: number): number {
  const n = Math.max(0, Math.round(kwhPerYear));
  if (n < 5000) return 2500;
  if (n < 10000) return 7500;
  if (n < 17000) return 13500;
  return 25000;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = normalizeArea(searchParams.get('area'));
  const consumptionParam = searchParams.get('consumption');
  const consumptionKwhPerYear = consumptionParam ? normalizeConsumption(Number(consumptionParam)) : 13500;

  try {
    const data = await fetchAreaPrices(area, {
      consumptionKwh: consumptionKwhPerYear,
      types: 'quarter_hourly,hourly,monthly',
    });
    const spot = data.spot_price?.ore_kwh;
    if (typeof spot !== 'number' || !Number.isFinite(spot)) {
      throw new Error('Spotpris saknas i svaret');
    }

    const providers: Record<string, ProviderPriceItem> = {};
    for (const partner of PRICE_PARTNERS) {
      const offer = variableOfferForSupplier(data.products, partner.slug, spot, consumptionKwhPerYear);
      if (!offer) continue;
      providers[partner.name] = offer;
      for (const alias of partner.aliases ?? []) {
        providers[alias] = offer;
      }
    }

    return NextResponse.json({ providers } satisfies ProviderPricesResponse, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error('Error fetching provider prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

export const runtime = 'edge';
