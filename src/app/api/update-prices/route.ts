import { NextResponse } from 'next/server';
import { fetchStockholmPrices } from '@/lib/elprishantering';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.UPDATE_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await fetchStockholmPrices();
    const fixed = (area: string, period: '6_months' | '1_year') =>
      data.variable_fixed_prices[area]?.[period] ?? null;

    return NextResponse.json({
      success: true,
      message: 'Prices updated successfully',
      timestamp: new Date().toISOString(),
      prices: {
        spot: data.spot_prices,
        fixed_6m: {
          se1: fixed('se1', '6_months'),
          se2: fixed('se2', '6_months'),
          se3: fixed('se3', '6_months'),
          se4: fixed('se4', '6_months'),
        },
        fixed_12m: {
          se1: fixed('se1', '1_year'),
          se2: fixed('se2', '1_year'),
          se3: fixed('se3', '1_year'),
          se4: fixed('se4', '1_year'),
        },
      },
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      {
        error: 'Failed to update prices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
