import { NextRequest, NextResponse } from 'next/server';
// removed unused createClient
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Create Supabase client per-request

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contractType, 
      logId, 
      savingsAmount, 
      sessionId, 
      source = 'jamfor-elpriser',
      utmSource,
      utmMedium,
      utmCampaign,
      heroVariant,
    } = body;

    // Validera att logId finns i invoice_ocr om det är angivet
    let validLogId = null;
    if (typeof logId === 'number') {
      const supabase = getSupabaseServerClient();
      const { data: logExists } = await supabase
        .from('invoice_ocr')
        .select('id')
        .eq('id', logId)
        .single();

      if (logExists) {
        validLogId = logId;
      }
    }

    // Hämta user agent och referer
    const ua = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Logga kontraktsklick
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('contract_clicks').insert({
      contract_type: typeof contractType === 'string' ? contractType : null,
      log_id: validLogId, // Kan vara null om logId inte finns
      savings_amount: typeof savingsAmount === 'number' ? savingsAmount : null,
      session_id: typeof sessionId === 'string' ? sessionId : null,
      source: typeof source === 'string' ? source : 'jamfor-elpriser',
      utm_source: typeof utmSource === 'string' ? utmSource : null,
      utm_medium: typeof utmMedium === 'string' ? utmMedium : null,
      utm_campaign: typeof utmCampaign === 'string' ? utmCampaign : null,
      hero_variant: typeof heroVariant === 'string' ? heroVariant : null,
      user_agent: ua,
      referer,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error logging contract click:', error);
      return NextResponse.json({ error: 'Failed to log contract click' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contract click tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
