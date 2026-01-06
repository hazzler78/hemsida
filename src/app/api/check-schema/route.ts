import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Fetch one row to see what columns are returned
    const { data: sampleData, error: sampleError } = await supabase
      .from('ai_campaigns')
      .select('*')
      .limit(1);

    if (sampleError) {
      return NextResponse.json({ 
        error: sampleError.message,
        hint: 'Could not fetch sample data from ai_campaigns table',
        details: sampleError
      }, { status: 500 });
    }

    // Get column names from the sample data
    const columnNames = sampleData && sampleData.length > 0 
      ? Object.keys(sampleData[0])
      : [];

    // Check specifically for date columns
    const dateColumns = columnNames.filter(col => 
      col.toLowerCase().includes('valid') || 
      col.toLowerCase().includes('date') ||
      col.toLowerCase().includes('from') ||
      col.toLowerCase().includes('to')
    );

    return NextResponse.json({
      success: true,
      table: 'ai_campaigns',
      columnNames: columnNames,
      dateColumns: dateColumns,
      sampleRow: sampleData?.[0] || null,
      columns: columnNames.map(col => ({
        name: col,
        type: typeof sampleData?.[0]?.[col],
        sampleValue: sampleData?.[0]?.[col]
      })),
      analysis: {
        hasValidFrom: columnNames.includes('validFrom') || columnNames.includes('valid_from'),
        hasValidTo: columnNames.includes('validTo') || columnNames.includes('valid_to'),
        validFromColumn: columnNames.find(col => col.toLowerCase().includes('valid') && col.toLowerCase().includes('from')),
        validToColumn: columnNames.find(col => col.toLowerCase().includes('valid') && col.toLowerCase().includes('to'))
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
