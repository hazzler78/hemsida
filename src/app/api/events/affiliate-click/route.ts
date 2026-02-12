import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Generera unikt tracking-ID
function generateTrackingId(): string {
  // Format: elchef_YYYYMMDD_HHMMSS_RANDOM
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `elchef_${dateStr}_${timeStr}_${random}`;
}

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.replace(/^"|"$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const rawServiceUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rawPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const SUPABASE_URL = sanitizeEnv(rawServiceUrl || rawPublicUrl);
    const SUPABASE_KEY = sanitizeEnv(rawServiceKey || rawAnonKey);

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase env saknas för affiliate-click', {
        hasServiceUrl: !!rawServiceUrl,
        hasServiceKey: !!rawServiceKey,
        hasPublicUrl: !!rawPublicUrl,
        hasAnonKey: !!rawAnonKey,
      });
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    const body = await req.json().catch(() => ({}));
    const { provider, contractType, url, sessionId, cameViaRobinhood, trackingId, heroVariant, source, preferences } =
      body || {};

    // Generera tracking-ID om det inte finns (för bakåtkompatibilitet)
    const finalTrackingId = trackingId || generateTrackingId();

    const { data, error } = await supabase
      .from('affiliate_clicks')
      .insert({
        provider: typeof provider === 'string' ? provider : null,
        contract_type: typeof contractType === 'string' ? contractType : null,
        url: typeof url === 'string' ? url : null,
        session_id: typeof sessionId === 'string' ? sessionId : null,
        user_agent: ua,
        referer,
        came_via_robinhood: typeof cameViaRobinhood === 'boolean' ? cameViaRobinhood : false,
        tracking_id: finalTrackingId,
        hero_variant: typeof heroVariant === 'string' ? heroVariant : null,
        source: typeof source === 'string' ? source : null,
        preferences: preferences ?? null,
      })
      .select('id, tracking_id')
      .single();

    if (error) {
      console.error('Supabase affiliate_clicks insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Returnera tracking-ID så att det kan läggas till i affiliate-länken
    return NextResponse.json({
      ok: true,
      trackingId: data?.tracking_id || finalTrackingId,
      clickId: data?.id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    console.error('Affiliate-click endpoint error:', message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';
