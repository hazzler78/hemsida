import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook för att ta emot försäljningar från leverantörer
 * 
 * Leverantörer kan anropa denna endpoint när en försäljning sker.
 * De skickar tracking-ID:t som finns i affiliate-länken (elchef_ref parameter).
 * 
 * Exempel anrop:
 * POST /api/webhooks/sales
 * {
 *   "trackingId": "elchef_20240115_143022_ABC123",
 *   "provider": "Cheap Energy",
 *   "contractType": "rorligt",
 *   "saleAmount": 15000.00,  // Valfritt
 *   "customerEmail": "kund@example.com",  // Valfritt
 *   "notes": "Försäljning genomförd"  // Valfritt
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    
    const { 
      trackingId, 
      provider, 
      contractType, 
      saleAmount, 
      customerEmail, 
      notes 
    } = body;

    // Validera att trackingId finns
    if (!trackingId || typeof trackingId !== 'string') {
      return NextResponse.json({ 
        error: 'trackingId krävs' 
      }, { status: 400 });
    }

    // Validera att provider finns
    if (!provider || typeof provider !== 'string') {
      return NextResponse.json({ 
        error: 'provider krävs' 
      }, { status: 400 });
    }

    // Validera contractType
    if (!contractType || !['rorligt', 'fastpris'].includes(contractType)) {
      return NextResponse.json({ 
        error: 'contractType måste vara "rorligt" eller "fastpris"' 
      }, { status: 400 });
    }

    // Hitta affiliate-klicket baserat på tracking-ID
    const { data: affiliateClick } = await supabase
      .from('affiliate_clicks')
      .select('id, provider, contract_type')
      .eq('tracking_id', trackingId)
      .single();

    // Om affiliate-klicket inte hittas, skapa ändå försäljningen (kan vara manuell)
    const affiliateClickId = affiliateClick?.id || null;

    // Kontrollera om försäljningen redan finns (förhindra dubbelregistrering)
    const { data: existingSale } = await supabase
      .from('affiliate_sales')
      .select('id')
      .eq('tracking_id', trackingId)
      .single();

    if (existingSale) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Försäljning redan registrerad',
        saleId: existingSale.id
      });
    }

    // Skapa försäljning
    const { data: sale, error: saleError } = await supabase
      .from('affiliate_sales')
      .insert({
        tracking_id: trackingId,
        affiliate_click_id: affiliateClickId,
        provider: provider,
        contract_type: contractType,
        sale_amount: typeof saleAmount === 'number' ? saleAmount : null,
        customer_email: typeof customerEmail === 'string' ? customerEmail : null,
        source: 'webhook',
        notes: typeof notes === 'string' ? notes : null,
      })
      .select('id')
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      return NextResponse.json({ 
        error: saleError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      saleId: sale?.id,
      message: 'Försäljning registrerad',
      affiliateClickId: affiliateClickId || null
    });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    console.error('Error in sales webhook:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';
