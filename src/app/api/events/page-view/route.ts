import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lista över kända botar och crawlers
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'ia_archiver',
  'gptbot',
  'perplexitybot',
  'anthropic-ai',
  'claude-web',
  'chatgpt-user',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'applebot',
  'petalbot',
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'dotbot',
  'megaindex',
  'blexbot',
  'crawler',
  'spider',
  'scraper'
];

function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function isPreviewDeployment(referer: string): boolean {
  if (!referer) return false;
  return referer.includes('preview') || referer.includes('localhost') || referer.includes('127.0.0.1');
}

export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      // On Cloudflare Pages preview/production, env vars might not be present; avoid spamming 500s
      return NextResponse.json({ ok: true, note: 'Supabase ej konfigurerat i denna miljö' }, { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    const body = await req.json().catch(() => ({}));
    const { path, sessionId, utmSource, utmMedium, utmCampaign, referrer: clientReferrer } = body || {};

    // Använd document.referrer från klient (var användaren landade ifrån) - mer korrekt än
    // fetch:s Referer-header som blir elchef.se. Klienten skickar var de kom ifrån.
    const effectiveReferrer = typeof clientReferrer === 'string' && clientReferrer
      ? clientReferrer
      : referer;

    // Identifiera om det är en bot eller preview-deployment
    const bot = isBot(ua);
    const isPreview = isPreviewDeployment(effectiveReferrer);

    const { error } = await supabase.from('page_views').insert({
      path: typeof path === 'string' ? path : null,
      session_id: typeof sessionId === 'string' ? sessionId : null,
      utm_source: typeof utmSource === 'string' ? utmSource : null,
      utm_medium: typeof utmMedium === 'string' ? utmMedium : null,
      utm_campaign: typeof utmCampaign === 'string' ? utmCampaign : null,
      user_agent: ua,
      referer: effectiveReferrer,
      is_bot: bot,
      is_preview: isPreview
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, is_bot: bot, is_preview: isPreview });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'edge';


