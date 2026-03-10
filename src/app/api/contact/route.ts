import { NextRequest, NextResponse } from 'next/server';
import { ContactFormData } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS?.split(',').map(id => id.trim()) || [];
const rawSUPABASE_URL = process.env.SUPABASE_URL;
const rawSUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Otovo Lead API configuration
const OTOVO_API_BASE_URL = process.env.OTOVO_API_BASE_URL ?? 'https://api.otovo.com';
const OTOVO_API_TOKEN = process.env.OTOVO_API_TOKEN;
const OTOVO_UTM_SOURCE = process.env.OTOVO_UTM_SOURCE ?? 'elchef_se';
const OTOVO_UTM_CAMPAIGN = process.env.OTOVO_UTM_CAMPAIGN ?? 'elchef_CPS_newbuilds';

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  // Strip surrounding quotes if present (common misconfiguration in dashboards)
  return trimmed.replace(/^"|"$/g, '');
}

function getSupabaseClient() {
  const url = sanitizeEnv(rawSUPABASE_URL);
  const key = sanitizeEnv(rawSUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    throw new Error('Supabase credentials are not configured');
  }
  return createClient(url, key);
}

async function sendTelegramNotification(
  data: ContactFormData & { formType?: string },
  contactId: number | null
) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    console.warn('Telegram credentials not configured');
    return;
  }

  // Store pending reminder in database
  const pendingReminderData = {
    customer_name: data.name || 'Okänd',
    email: data.email,
    phone: data.phone || null,
    message: data.message || null,
    created_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  const { data: pending, error: pendingError } = await supabase
    .from('pending_reminders')
    .insert([pendingReminderData])
    .select()
    .single();

  if (pendingError || !pending) {
    console.error('Error creating pending reminder:', pendingError);
    return;
  }

  const formType = data.formType || 'contact';
  const formLabel = formType === 'sol_laddbox' ? '☀️ *Solceller/Laddbox-offert*' : '🔔 *Ny kontaktförfrågan*';
  const message = `
${formLabel}

${data.name ? `🙍‍♂️ *Namn:* ${data.name}\n` : ''}📧 *E-post:* ${data.email}
${data.phone ? `📞 *Telefon:* ${data.phone}\n` : ''}${data.city ? `🏙️ *Stad:* ${data.city}\n` : ''}${data.address ? `📍 *Adress:* ${data.address}\n` : ''}${formType !== 'sol_laddbox' ? `📰 *Nyhetsbrev:* ${data.subscribeNewsletter ? 'Ja' : 'Nej'}\n` : ''}${data.message ? `\n📝 *Meddelande:* ${data.message}` : ''}

⏰ *Tidpunkt:* ${new Date().toLocaleString('sv-SE')}
🌐 *Källa:* Elchef.se kontaktformulär

🆔 *Kontakt-ID (contacts):* ${contactId ?? '-'}

💡 *Svara på detta meddelande* eller skriv t.ex. "12m #${pending.id}" för att koppla rätt kund.
*Exempel:* "12m" eller "12m cheap" eller "12m fastavtal" (vi ringer kunden om 11 månader)
_Du kan även ange startdatum:_ "12m 2025-02-15 cheap" eller "12m 2025-02-15 #${pending.id} fastavtal"
`;

  // Send to all configured chat IDs
  const sendPromises = TELEGRAM_CHAT_IDS.map(async (chatId) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        console.error(`Telegram notification failed for chat ID ${chatId}:`, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error sending Telegram notification to ${chatId}:`, error);
      return false;
    }
  });

  // Wait for all notifications to be sent
  const results = await Promise.all(sendPromises);
  const successCount = results.filter(Boolean).length;
  console.log(`Telegram notifications sent: ${successCount}/${TELEGRAM_CHAT_IDS.length} successful`);
}

async function addToMailerlite(email: string) {
  if (!MAILERLITE_API_KEY) {
    console.error('MAILERLITE_API_KEY saknas i miljövariabler');
    return false;
  }

  const body: Record<string, unknown> = {
    email: email,
    status: 'active',
  };
  
  if (MAILERLITE_GROUP_ID && !isNaN(Number(MAILERLITE_GROUP_ID))) {
    body.groups = [Number(MAILERLITE_GROUP_ID)];
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mailerlite API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding to Mailerlite:', error);
    return false;
  }
}

function parseYearlyConsumptionKwh(raw?: string | null): number | null {
  if (!raw) return null;
  const digitsOnly = raw.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;
  const value = Number(digitsOnly);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

async function sendOtovoInterest(data: ContactFormData & { ref?: string; campaignCode?: string; formType?: string }) {
  if (!OTOVO_API_TOKEN) {
    console.warn('OTOVO_API_TOKEN is not configured, skipping Otovo lead creation');
    return;
  }

  try {
    const addressParts: string[] = [];
    if (data.address && data.address.trim()) addressParts.push(data.address.trim());
    if (data.city && data.city.trim()) addressParts.push(data.city.trim());
    const address = addressParts.join(', ');

    const yearlyConsumptionKwh = parseYearlyConsumptionKwh((data as any).consumption);

    const utm_data = {
      utm_campaign: OTOVO_UTM_CAMPAIGN,
      utm_medium: 'lead-generation',
      utm_source: OTOVO_UTM_SOURCE,
      utm_term: '',
      utm_id: data.campaignCode || data.ref || '',
    };

    const body: Record<string, unknown> = {
      name: data.name || '',
      email: data.email,
      phone_number: data.phone || '',
      utm_data,
    };

    if (address) {
      body.address = address;
    }

    if (yearlyConsumptionKwh) {
      body.extra_information = {
        yearly_consumption_kwh: yearlyConsumptionKwh,
      };
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Token ${OTOVO_API_TOKEN}`,
    };

    const validateRes = await fetch(`${OTOVO_API_BASE_URL}/partner/v1/interests/validate_data`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!validateRes.ok) {
      console.error('Otovo validate_data request failed:', validateRes.status, await validateRes.text());
      return;
    }

    const validateJson = await validateRes.json() as { is_valid?: boolean; result?: unknown; message?: string };

    if (!validateJson.is_valid) {
      console.warn('Otovo validate_data reported invalid payload:', validateJson);
      return;
    }

    const createRes = await fetch(`${OTOVO_API_BASE_URL}/partner/v1/interests/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      console.error('Otovo interest creation failed:', createRes.status, await createRes.text());
      return;
    }

    const created = await createRes.json();
    console.log('Otovo interest created successfully:', created);
  } catch (error) {
    console.error('Error while sending Otovo interest:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData & { ref?: string; campaignCode?: string; formType?: string } = await request.json();

    // Validera e-postadress
    if (!data.email || !data.email.includes('@')) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Determine form type based on data or ref
    let formType = data.formType || 'contact';
    if (data.ref?.includes('chat')) formType = 'chat';
    if (data.ref?.includes('newsletter')) formType = 'newsletter';
    if (data.ref?.includes('affiliate')) formType = 'affiliate';
    if (data.ref?.includes('partner')) formType = 'partner';

    // Store contact with enhanced tracking and capture ID
    let contactId: number | null = null;
    try {
      const supabase = getSupabaseClient();
      const { data: contactRow, error } = await supabase
        .from('contacts')
        .insert([{
          name: data.name || null,
          email: data.email,
          phone: data.phone || null,
          message: data.message || null,
          ref: data.ref || null,
          campaign_code: data.campaignCode || null,
          subscribe_newsletter: !!data.subscribeNewsletter,
          form_type: formType,
          city: data.city?.trim() || null,
          address: data.address?.trim() || null,
          created_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

      if (!error && contactRow) {
        contactId = contactRow.id as number;
      } else if (error) {
        console.warn('Failed to store contact with ref (optional):', error);
      }
    } catch (e) {
      console.warn('Failed to store contact with ref (optional):', e);
    }

    // Skapa pending-reminder och skicka Telegram-notifiering (med ID)
    await sendTelegramNotification({ ...data, formType }, contactId);

    // Lägg till i Mailerlite om användaren vill prenumerera
    let newsletterSuccess = true;
    if (data.subscribeNewsletter) {
      newsletterSuccess = await addToMailerlite(data.email);
    }

    // Skicka solcells-lead till Otovos Lead API för relevanta formulär
    if (formType === 'sol_laddbox') {
      await sendOtovoInterest({ ...data, formType });
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Kontaktförfrågan skickad',
        newsletterSubscribed: data.subscribeNewsletter && newsletterSuccess
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid skickande av kontaktförfrågan' },
      { status: 500 }
    );
  }
} 

export const runtime = 'edge'; 