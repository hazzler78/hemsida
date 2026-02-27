import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'edge';

const ADMIN_PASSWORD = process.env.ADMIN_DASHBOARD_PASSWORD || 'grodan2025';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS?.split(',').map((id) => id.trim()) || [];

async function sendToTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) return false;
  let success = true;
  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      if (!res.ok) success = false;
    } catch {
      success = false;
    }
  }
  return success;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-password');
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const days = parseInt(req.nextUrl.searchParams.get('days') || '7', 10);
    const from = new Date();
    from.setDate(from.getDate() - Math.min(days, 90));
    const fromISO = from.toISOString();

    const supabase = getSupabaseServerClient();

    const { data: chatlog, error } = await supabase
      .from('chatlog')
      .select('id, created_at, messages')
      .gte('created_at', fromISO)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userMessages: string[] = [];
    const providerMentions: Record<string, number> = {};
    const providers = [
      'cheap energy',
      'greenely',
      'tibber',
      'vattenfall',
      'eon',
      'e.on',
      'fortum',
      'svekraft',
      'svealands',
      'motala',
      'telinet',
    ];

    for (const row of chatlog || []) {
      const msgs = (row.messages as Array<{ role: string; content: string }>) || [];
      for (const m of msgs) {
        if (m.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
          const text = m.content.trim();
          if (text.length > 10 && !userMessages.includes(text)) {
            userMessages.push(text);
          }
          const lower = text.toLowerCase();
          for (const p of providers) {
            if (lower.includes(p)) {
              providerMentions[p] = (providerMentions[p] || 0) + 1;
            }
          }
        }
      }
    }

    const totalChats = chatlog?.length ?? 0;
    const topProviders = Object.entries(providerMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n, c]) => `${n} (${c})`)
      .join(', ');

    const recentQuestions = userMessages.slice(0, 8).map((q) => `• ${q.length > 80 ? q.slice(0, 77) + '...' : q}`).join('\n');

    const lines = [
      `📊 *GrokChat-sammanfattning* (senaste ${days} dagar)`,
      '',
      `*${totalChats}* chattutbyten`,
      '',
      '*Vanligast nämnda leverantörer:*',
      topProviders || '-',
      '',
      '*Exempel på frågor:*',
      recentQuestions || '-',
      '',
      '_Kör \`npm run chatlog\` för full export._',
    ];

    let body = lines.join('\n');
    if (body.length > 4000) {
      lines.splice(6, 9, '• (för många – se admin/chatlog)');
      body = lines.join('\n');
    }

    const sent = await sendToTelegram(body);

    return NextResponse.json({
      ok: sent,
      days,
      totalChats,
      uniqueQuestions: userMessages.length,
      telegramConfigured: !!TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_IDS.length > 0,
    });
  } catch (e) {
    console.error('Telegram summary error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    );
  }
}
