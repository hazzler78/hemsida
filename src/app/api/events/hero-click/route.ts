import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.replace(/^"|"$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const rawServiceUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback för lokal utveckling: använd public URL/anon key om service-role saknas
    const rawPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const SUPABASE_URL = sanitizeEnv(rawServiceUrl || rawPublicUrl);
    const SUPABASE_KEY = sanitizeEnv(rawServiceKey || rawAnonKey);

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase env saknas för hero-click', {
        hasServiceUrl: !!rawServiceUrl,
        hasServiceKey: !!rawServiceKey,
        hasPublicUrl: !!rawPublicUrl,
        hasAnonKey: !!rawAnonKey,
      });
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
      },
    });

    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    const body = await req.json().catch(() => ({}));
    const { variant, href, sessionId, target } = body || {};

    const { error } = await supabase.from('hero_clicks').insert({
      variant: typeof variant === 'string' ? variant : null,
      href: typeof href === 'string' ? href : null,
      target: typeof target === 'string' ? target : null,
      session_id: typeof sessionId === 'string' ? sessionId : null,
      user_agent: ua,
      referer,
    });

    if (error) {
      console.error('Supabase hero_clicks insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    console.error('Hero-click endpoint error:', message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';

