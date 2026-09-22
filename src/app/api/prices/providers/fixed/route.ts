import { NextResponse } from 'next/server';
import {
  fetchAreaPrices,
  fixedPriceForPeriod,
  PRICE_PARTNERS,
  REVALIDATE_SECONDS,
  type FixedPeriodKey,
} from '@/lib/elprishantering';

const VALID_PERIODS: FixedPeriodKey[] = [
  '3_months',
  '6_months',
  '9_months',
  '1_year',
  '2_years',
  '3_years',
  '4_years',
  '5_years',
  '6_years',
  '7_years',
  '8_years',
  '9_years',
  '10_years',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = (searchParams.get('area') || 'se3').toLowerCase();
  const period = (searchParams.get('period') || '1_year') as FixedPeriodKey;
  const validArea = ['se1', 'se2', 'se3', 'se4'].includes(area) ? area : 'se3';
  const validPeriod = VALID_PERIODS.includes(period) ? period : '1_year';

  try {
    const data = await fetchAreaPrices(validArea, { types: 'fixed' });
    const providers: Record<string, number> = {};
    for (const partner of PRICE_PARTNERS) {
      const price = fixedPriceForPeriod(data.products, partner.slug, validPeriod);
      if (price == null) continue;
      providers[partner.name] = price;
      for (const alias of partner.aliases ?? []) {
        providers[alias] = price;
      }
    }

    return NextResponse.json(
      { providers },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching fixed prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

export const runtime = 'edge';
