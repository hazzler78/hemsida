import { createClient } from '@supabase/supabase-js';

// Note: we avoid importing Cloudflare-specific types here so that Next.js type
// checking during build does not fail. The runtime environment still receives
// the correct context object from Cloudflare Pages.
export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const { email, ref, campaignCode }: { email: string; ref?: string; campaignCode?: string } = await request.json();

    const MAILERLITE_API_KEY = env.MAILERLITE_API_KEY as string | undefined;
    const MAILERLITE_GROUP_ID = env.MAILERLITE_GROUP_ID as string | undefined;
    const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN as string | undefined;
    const TELEGRAM_CHAT_IDS = (env.TELEGRAM_CHAT_IDS as string | undefined)
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean) || [];

    // Spara nyhetsbrevsanmälan i Supabase (contacts) för analytics
    const SUPABASE_URL = env.SUPABASE_URL as string | undefined;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      try {
        await supabase.from('contacts').insert([
          {
            email: email,
            ref: ref || 'newsletter',
            campaign_code: campaignCode || null,
            subscribe_newsletter: true,
            form_type: 'newsletter',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        console.warn('Failed to store newsletter subscription for analytics:', e);
      }
    }

    // Validera e-postadress
    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'Ogiltig e-postadress' }, 400);
    }

    // Kontrollera att API-nyckeln finns
    if (!MAILERLITE_API_KEY) {
      console.error('MAILERLITE_API_KEY saknas i miljövariabler');
      return jsonResponse({ error: 'Konfigurationsfel' }, 500);
    }

    // Bygg body för Mailerlite
    const body: Record<string, unknown> = {
      email: email,
      status: 'active',
    };

    if (MAILERLITE_GROUP_ID && !isNaN(Number(MAILERLITE_GROUP_ID))) {
      body.groups = [Number(MAILERLITE_GROUP_ID)];
    }
    // Om grupp-ID saknas eller är ogiltigt, skicka inte 'groups' alls (prenumerant hamnar i "All subscribers")

    // Lägg till prenumerant i Mailerlite
    const mlResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      let errorData: any = null;
      try {
        errorData = await mlResponse.json();
      } catch {
        // ignore JSON parse errors
      }

      console.error('Mailerlite API error:', errorData || mlResponse.statusText);

      if (mlResponse.status === 409) {
        return jsonResponse({ error: 'Denna e-postadress är redan registrerad' }, 409);
      }

      const message: string | undefined =
        (errorData && (errorData.message || errorData.error || errorData?.errors?.[0])) as string | undefined;

      if (message && message.toLowerCase().includes('subscriber') && message.toLowerCase().includes('limit')) {
        return jsonResponse(
          {
            error:
              'Vi har nått gränsen för prenumeranter i vårt nyhetsbrev just nu. Försök gärna igen senare.',
          },
          429,
        );
      }

      if (errorData?.errors?.['groups.0']?.includes('The selected groups.0 is invalid.')) {
        return jsonResponse(
          {
            error:
              'Felaktigt grupp-ID för Mailerlite. Kontrollera att MAILERLITE_GROUP_ID är korrekt eller ta bort den från miljövariablerna för att lägga till prenumeranter i "All subscribers".',
          },
          400,
        );
      }

      return jsonResponse({ error: 'Kunde inte registrera e-postadressen' }, 500);
    }

    const data = await mlResponse.json();

    // Telegram notification (optional)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_IDS.length > 0) {
      const msg = `\n📰 *Ny nyhetsbrevsanmälan*\n\n📧 E-post: ${email}\n🏷️ Ref: ${
        ref || '-'
      }\n🎟️ Kampanjkod: ${campaignCode || '-'}\n⏰ ${new Date().toLocaleString('sv-SE')}`;

      await Promise.all(
        TELEGRAM_CHAT_IDS.map((chatId) =>
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
          }),
        ),
      );
    }

    return jsonResponse(
      {
        success: true,
        message: 'Prenumeration registrerad',
        subscriber_id: data?.data?.id,
      },
      200,
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return jsonResponse({ error: 'Ett fel uppstod vid registrering' }, 500);
  }
};

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

