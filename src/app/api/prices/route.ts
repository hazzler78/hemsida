import { NextResponse } from 'next/server';
import { CheapEnergyPrices } from '@/lib/types';

export async function GET() {
  try {
    console.log('Fetching prices from Stockholms Elbolag...');
    
    const response = await fetch('https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json', {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Elchef-Price-Checker/1.0'
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch from Stockholms Elbolag:', response.status, response.statusText);
      throw new Error(`Failed to fetch prices from Stockholms Elbolag: ${response.status}`);
    }

    const data: CheapEnergyPrices = await response.json();
    
    console.log('Successfully fetched prices from Stockholms Elbolag');
    console.log('Spot prices:', data.spot_prices);
    console.log('Fixed prices (6 months):', {
      se1: data.variable_fixed_prices.se1['6_months'],
      se2: data.variable_fixed_prices.se2['6_months'],
      se3: data.variable_fixed_prices.se3['6_months'],
      se4: data.variable_fixed_prices.se4['6_months']
    });
    console.log('Fixed prices (12 months):', {
      se1: data.variable_fixed_prices.se1['1_year'],
      se2: data.variable_fixed_prices.se2['1_year'],
      se3: data.variable_fixed_prices.se3['1_year'],
      se4: data.variable_fixed_prices.se4['1_year']
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge'; 