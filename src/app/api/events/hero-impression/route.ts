import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.replace(/^"|"$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const rawSUPABASE_URL = process.env.SUPABASE_URL;
    const rawSUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const SUPABASE_URL = sanitizeEnv(rawSUPABASE_URL);
    const SUPABASE_SERVICE_ROLE_KEY = sanitizeEnv(rawSUPABASE_SERVICE_ROLE_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env saknas', { 
        hasUrl: !!rawSUPABASE_URL, 
        hasKey: !!rawSUPABASE_SERVICE_ROLE_KEY 
      });
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
      global: {
        fetch: async (url, options) => {
          // Create a new timeout controller for each request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekunder timeout
          
          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Request timeout - Supabase connection took too long');
            }
            throw error;
          }
        },
      },
    });

    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    const body = await req.json().catch(() => ({}));
    const { variant, sessionId } = body || {};

    const { error, data } = await supabase.from('hero_impressions').insert({
      variant: typeof variant === 'string' ? variant : null,
      session_id: typeof sessionId === 'string' ? sessionId : null,
      user_agent: ua,
      referer,
    }).select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    const errorDetails = e instanceof Error ? { name: e.name, stack: e.stack } : {};
    console.error('Hero impression endpoint error:', message, errorDetails);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';


