import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    const body = await req.json().catch(() => ({}));
    const { provider, contractType, url, sessionId } = body || {};

    const { error } = await supabase.from('affiliate_clicks').insert({
      provider: typeof provider === 'string' ? provider : null,
      contract_type: typeof contractType === 'string' ? contractType : null,
      url: typeof url === 'string' ? url : null,
      session_id: typeof sessionId === 'string' ? sessionId : null,
      user_agent: ua,
      referer,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';

