import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = new Set([
  'landing_fakturaanalys',
  'ocr_started',
  'ocr_completed',
  'ocr_failed',
  'contract_click',
]);

export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: true, note: 'Supabase ej konfigurerat' });
    }

    const body = await req.json().catch(() => ({}));
    const event = typeof body.event === 'string' ? body.event : '';
    if (!ALLOWED.has(event)) {
      return NextResponse.json({ error: 'invalid_event' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const row = {
      event,
      path: typeof body.path === 'string' ? body.path : null,
      session_id: typeof body.sessionId === 'string' ? body.sessionId : null,
      utm_source: typeof body.utmSource === 'string' ? body.utmSource : null,
      utm_medium: typeof body.utmMedium === 'string' ? body.utmMedium : null,
      utm_campaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : null,
      utm_content: typeof body.utmContent === 'string' ? body.utmContent : null,
      meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
      user_agent: ua,
      referer,
    };

    const { error } = await supabase.from('funnel_events').insert(row);
    if (!error) {
      return NextResponse.json({ ok: true, store: 'funnel_events' });
    }

    // Fallback om tabellen saknas: page_views med is_preview=true (räknas inte som landning i social_post_performance)
    const { error: pvErr } = await supabase.from('page_views').insert({
      path: `/__funnel__/${event}`,
      session_id: row.session_id,
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      utm_campaign: row.utm_campaign,
      utm_content: row.utm_content,
      user_agent: ua,
      referer,
      is_bot: false,
      is_preview: true,
    });

    if (pvErr) {
      console.error('funnel event failed', error.message, pvErr.message);
      return NextResponse.json({ ok: true, note: 'funnel_store_failed' });
    }
    return NextResponse.json({
      ok: true,
      store: 'page_views_fallback',
      hint: 'Run supabase-funnel-events.sql for dedicated table',
    });
  } catch (e) {
    console.error('funnel event error', e);
    return NextResponse.json({ ok: true, note: 'swallowed_error' });
  }
}

export const runtime = 'edge';
