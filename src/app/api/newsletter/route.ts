import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS?.split(',').map(id => id.trim()) || [];

export async function POST(request: NextRequest) {
  try {
    const { email, ref, campaignCode }: { email: string; ref?: string; campaignCode?: string } = await request.json();

    // Store newsletter subscription in contacts table for analytics
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      try {
        await supabase.from('contacts').insert([{
          email: email,
          ref: ref || 'newsletter',
          campaign_code: campaignCode || null,
          subscribe_newsletter: true,
          form_type: 'newsletter',
          created_at: new Date().toISOString(),
        }]);
      } catch (e) {
        console.warn('Failed to store newsletter subscription for analytics:', e);
      }
    }

    // Validera e-postadress
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Kontrollera att API-nyckeln finns
    if (!MAILERLITE_API_KEY) {
      console.error('MAILERLITE_API_KEY saknas i miljövariabler');
      return NextResponse.json(
        { error: 'Konfigurationsfel' },
        { status: 500 }
      );
    }

    // Bygg body för Mailerlite
    const body: Record<string, unknown> = {
      email: email,
      status: 'active',
    };
    // Hantera grupp-ID som sträng för att undvika precisionstapp för stora tal
    if (MAILERLITE_GROUP_ID) {
      body.groups = [MAILERLITE_GROUP_ID];
    }
    // Om grupp-ID saknas, skicka inte 'groups' alls (prenumerant hamnar i "All subscribers")

    // Lägg till prenumerant i Mailerlite
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
      // Hantera specifika fel
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Denna e-postadress är redan registrerad' },
          { status: 409 }
        );
      }
      // Plan-limit hos MailerLite (t.ex. "The subscriber might exceed the current subscriber limit.")
      const message: string | undefined = (errorData && (errorData.message || errorData.error || errorData?.errors?.[0])) as string | undefined;
      if (message && message.toLowerCase().includes('subscriber') && message.toLowerCase().includes('limit')) {
        return NextResponse.json(
          { error: 'Vi har nått gränsen för prenumeranter i vårt nyhetsbrev just nu. Försök gärna igen senare.' },
          { status: 429 }
        );
      }
      if (errorData?.errors?.['groups.0']?.includes('The selected groups.0 is invalid.')) {
        return NextResponse.json(
          { error: 'Felaktigt grupp-ID för Mailerlite. Kontrollera att MAILERLITE_GROUP_ID är korrekt eller ta bort den från .env.local för att lägga till prenumeranter i "All subscribers".' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Kunde inte registrera e-postadressen' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Telegram notification (optional)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_IDS.length > 0) {
      const msg = `\n📰 *Ny nyhetsbrevsanmälan*\n\n📧 E-post: ${email}\n🏷️ Ref: ${ref || '-'}\n🎟️ Kampanjkod: ${campaignCode || '-'}\n⏰ ${new Date().toLocaleString('sv-SE')}`;
      await Promise.all(TELEGRAM_CHAT_IDS.map(chatId => fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      })));
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Prenumeration registrerad',
        subscriber_id: data.data.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    );
  }
} 

export const runtime = 'edge'; 