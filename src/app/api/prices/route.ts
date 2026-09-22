import { NextResponse } from 'next/server';
import { fetchStockholmPrices, REVALIDATE_SECONDS } from '@/lib/elprishantering';

export async function GET() {
  try {
    const data = await fetchStockholmPrices();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
