import { NextRequest, NextResponse } from 'next/server';
import { PendingReminder } from '@/lib/types';
// removed unused createClient
import { getSupabaseServerClient } from '@/lib/supabaseServer';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// Do not throw at module load; guard inside handlers to avoid build-time failures

// Create Supabase client per-request

// Helper functions for precise date handling
function addMonthsKeepingEnd(date: Date, monthsToAdd: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + monthsToAdd);
  // If month rolled over (e.g., adding 1 month to Jan 31 → Mar 03), snap to last day of previous month
  if (result.getDate() < originalDay) {
    result.setDate(0);
  }
  return result;
}

function formatLocalYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper function to calculate reminder date (11 months before contract expiry)
function calculateReminderDate(contractStartDate: string, contractType: string): string {
  const startDate = new Date(contractStartDate);
  let totalMonths: number;

  switch (contractType) {
    case '12_months':
      totalMonths = 12;
      break;
    case '24_months':
      totalMonths = 24;
      break;
    case '36_months':
      totalMonths = 36;
      break;
    default:
      throw new Error('Invalid contract type');
  }

  // 11 months before expiry = start + (totalMonths - 11) months
  const reminderDate = addMonthsKeepingEnd(startDate, totalMonths - 11);
  return formatLocalYYYYMMDD(reminderDate);
}

// Helper function to send Telegram message
async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Extract URL from message
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  return urlMatch ? urlMatch[0] : null;
}

// Fetch page and extract title + readable text + image (simple heuristic, no external deps)
async function fetchPageSummary(url: string): Promise<{ title: string; text: string; image: string | null } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'elchef-telegram-bot/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : url;

    // Extract og:image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
    let imageUrl = ogImageMatch ? ogImageMatch[1] : null;
    
    // Make relative URLs absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const base = new URL(url);
        imageUrl = new URL(imageUrl, base.origin).href;
      } catch {
        imageUrl = null;
      }
    }

    // Prefer meta description when available
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

    // Strip scripts/styles and tags to get plain text
    const bodyMatch = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .match(/<body[\s\S]*?<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[0] : html;
    const text = bodyHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const combined = [metaDescription, text].filter(Boolean).join(' \n ');
    // Limit to avoid sending huge prompts
    const limited = combined.slice(0, 6000);

    return { title, text: limited, image: imageUrl };
  } catch {
    return null;
  }
}

// Summarize content with Grok (X.ai)
async function summarizeWithXAI(title: string, content: string): Promise<string | null> {
  if (!XAI_API_KEY) return null;
  const system = [
    'Du är en svensk redaktör för elchef.se. Du får en artikel (titel + text) från en extern länk.',
    'Skapa en kort sammanfattning anpassad för Telegram i Markdown med:',
    '- En tydlig rubrik (fetstil).',
    '- 3–6 viktigaste punkter i punktlista, konkreta och korta.',
    '- En kort slutsats eller varför detta är relevant för våra läsare.',
    'Undvik överdrifter. Använd svensk ton, enkel och saklig.'
  ].join('\n');

  const user = `TITEL: ${title}\n\nTEXT:\n${content}`;

  const res = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      stream: false,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

// Parse contract response from team
function parseContractResponse(text: string): { contractType: string; startDate?: string; note?: string } | null {
  const trimmed = text.trim();
  // Accept formats:
  //  - "12m"
  //  - "12m <YYYY-MM-DD>"
  //  - "12m <note>"
  //  - "12m <YYYY-MM-DD> <note>"
  const regex = /^(\d{1,2})m(?:\s+(\d{4}-\d{2}-\d{2}))?(?:\s+(.+))?$/i;
  const match = trimmed.match(regex);

  if (!match) return null;

  const months = parseInt(match[1]);
  const startDate = match[2];
  const noteRaw = match[3];

  let contractType: string;
  switch (months) {
    case 12:
      contractType = '12_months';
      break;
    case 24:
      contractType = '24_months';
      break;
    case 36:
      contractType = '36_months';
      break;
    default:
      return null;
  }

  const note = noteRaw ? noteRaw.trim() : undefined;
  return { contractType, startDate, note };
}

// POST: Handle Telegram webhook
export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 200 });
    }
    const update = await request.json();
    
    // Handle only message updates
    if (!update.message || !update.message.text) {
      return NextResponse.json({ success: true });
    }

    const { message } = update;
    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    // 0) If the message contains a URL, summarize it and reply with a card
    const sharedUrl = extractUrl(text);
    if (sharedUrl) {
      try {
        await sendTelegramMessage(chatId, '⏳ Analyserar länken och sammanfattar innehållet...');
        const page = await fetchPageSummary(sharedUrl);
        if (!page) {
          await sendTelegramMessage(chatId, '❌ Kunde inte hämta sidan. Kontrollera länken och försök igen.');
          return NextResponse.json({ success: true });
        }

        // Decode basic HTML entities in title
        const decodedTitle = page.title
          .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');

        const summary = await summarizeWithXAI(decodedTitle, page.text);
        const summaryText = summary && summary.trim().length > 0 ? summary.trim() : '';
        const card = [
          `**${decodedTitle}**`,
          '',
          summaryText || 'Ingen sammanfattning kunde genereras.',
          '',
          `[Läs mer](${sharedUrl})`
        ].join('\n');

        // Save card to Supabase for website listing
        try {
          const supabase = getSupabaseServerClient();
          const { error } = await supabase
            .from('shared_cards')
            .insert([
              {
                title: decodedTitle,
                summary: summaryText,
                url: sharedUrl,
                image_url: page.image,
                source_host: (() => { try { return new URL(sharedUrl).hostname; } catch { return null; } })(),
              }
            ]);
          if (error) console.error('Error inserting shared card:', error);
        } catch (e) {
          console.error('Insert shared card exception:', e);
        }

        await sendTelegramMessage(chatId, card);
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error('Error summarizing shared URL:', err);
        await sendTelegramMessage(chatId, '❌ Ett fel uppstod när länken skulle sammanfattas. Försök igen.');
        return NextResponse.json({ success: true });
      }
    }

    // Determine target pending reminder using #ID in message or reply metadata
    // 1) Prefer explicit pattern in the operator's message: e.g., "12m #123"
    const inlineIdMatch = text.match(/#(\d+)/);
    let targetPending: PendingReminder | null = null;
    if (inlineIdMatch) {
      const id = parseInt(inlineIdMatch[1]);
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('pending_reminders')
        .select('*')
        .eq('id', id)
        .limit(1);
      if (error) {
        console.error('Error fetching pending by inline ID:', error);
      }
      targetPending = (data && data.length > 0 ? (data[0] as PendingReminder) : null);
    }

    if (!targetPending && message.reply_to_message) {
      // 2) If replying: extract ID from the replied message
      const repliedText: string = message.reply_to_message.text || '';
      const replyIdMatch = repliedText.match(/\bID:\s*(\d+)\b/i);
      if (replyIdMatch) {
        const replyId = parseInt(replyIdMatch[1]);
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from('pending_reminders')
          .select('*')
          .eq('id', replyId)
          .limit(1);
        if (error) {
          console.error('Error fetching pending by reply ID:', error);
        }
        targetPending = (data && data.length > 0 ? (data[0] as PendingReminder) : null);
      } else {
        // 3) Fallback by email in the replied text
        const emailMatch = repliedText.match(/E-post:\s*([^\s]+)/i);
        if (emailMatch) {
          const email = emailMatch[1];
          const supabase = getSupabaseServerClient();
          const { data, error } = await supabase
            .from('pending_reminders')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1);
          if (error) {
            console.error('Error fetching pending by email:', error);
          }
          targetPending = (data && data.length > 0 ? (data[0] as PendingReminder) : null);
        }
      }
    }

    if (!targetPending) {
      await sendTelegramMessage(chatId, '❌ Kunde inte identifiera kunden. Svara på kontaktmeddelandet eller skriv t.ex. "12m #123" (använd ID från kortet).');
      return NextResponse.json({ success: true });
    }

      const pendingReminder = targetPending;
      
      // Parse the contract response (accepts '12m' or '12m YYYY-MM-DD')
      const contractInfo = parseContractResponse(text);
      
      if (contractInfo) {
        try {
          // Determine contract start date: if provided use it, otherwise use today
          const contractStart = contractInfo.startDate || new Date().toISOString().split('T')[0];
          // Calculate reminder date
          // If only "Xm" provided (no start date), remind in 11 months from today
          const reminderDate = contractInfo.startDate
            ? calculateReminderDate(contractStart, contractInfo.contractType)
            : formatLocalYYYYMMDD(addMonthsKeepingEnd(new Date(), 11));
          
          // Create reminder in database
          const reminderData = {
            customer_name: pendingReminder.customer_name,
            email: pendingReminder.email,
            phone: pendingReminder.phone,
            contract_type: contractInfo.contractType,
            contract_start_date: contractStart,
            reminder_date: reminderDate,
            is_sent: false,
            notes: `Skapad via Telegram svar: ${text}${contractInfo.note ? ` | Notering: ${contractInfo.note}` : ''}`
          };

          const supabase = getSupabaseServerClient();
          const { error } = await supabase
            .from('customer_reminders')
            .insert([reminderData])
            .select()
            .single();

          if (error) {
            console.error('Error creating reminder:', error);
            await sendTelegramMessage(chatId, '❌ Kunde inte skapa påminnelse. Försök igen.');
          } else {
            // Delete the pending reminder
            const supabase = getSupabaseServerClient();
            await supabase
              .from('pending_reminders')
              .delete()
              .eq('id', pendingReminder.id);

            // Calculate expiry date for confirmation message
            const startDate = new Date(contractStart);
            const expiryDate = new Date(startDate);
            switch (contractInfo.contractType) {
              case '12_months':
                expiryDate.setMonth(expiryDate.getMonth() + 12);
                break;
              case '24_months':
                expiryDate.setMonth(expiryDate.getMonth() + 24);
                break;
              case '36_months':
                expiryDate.setMonth(expiryDate.getMonth() + 36);
                break;
            }

            const confirmationMessage = `
✅ *Påminnelse skapad!*

👤 *Kund:* ${pendingReminder.customer_name}
📋 *Avtalstyp:* ${contractInfo.contractType === '12_months' ? '12 månader' : 
                  contractInfo.contractType === '24_months' ? '24 månader' : '36 månader'}
📅 *Startdatum:* ${startDate.toLocaleDateString('sv-SE')}
⏰ *Avtal går ut:* ${expiryDate.toLocaleDateString('sv-SE')}
🔔 *Påminnelse skickas:* ${new Date(reminderDate).toLocaleDateString('sv-SE')}

Påminnelse kommer skickas 11 månader före avtalsutgång.
            `;

            await sendTelegramMessage(chatId, confirmationMessage);
          }
        } catch (error) {
          console.error('Error processing contract response:', error);
          await sendTelegramMessage(chatId, '❌ Ett fel uppstod. Kontrollera formatet och försök igen.');
        }
      } else {
        await sendTelegramMessage(chatId, '❌ Felaktigt format. Skriv t.ex. "12m" eller "12m 2025-02-15". Du kan även ange ID: "12m #123".');
      }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Set webhook (call this once to configure Telegram)
export async function GET(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 200 });
    }
    // Prefer the actual request origin (works across custom domains and environments)
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const forwardedHost = request.headers.get('x-forwarded-host');
    const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;

    // Optional override: /api/telegram-webhook?origin=https://www.example.com
    const originOverride = request.nextUrl.searchParams.get('origin');
    const webhookUrl = `${originOverride || requestOrigin}/api/telegram-webhook`;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook set successfully',
        webhookUrl 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';