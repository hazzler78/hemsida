'use client';

import Link from 'next/link';

const SALESYS_STATS_URL =
  'https://statistik.salesys.se/497D41e8287176eACd7f87AC0c2375da11D3354DE745CeA05CDD6d12cABb5cB0A8cf3d15/6970aa19ea9140b4172061ec';

type FunnelStep = {
  step: number;
  title: string;
  what: string;
  where: string;
  href?: string;
  external?: boolean;
};

const FUNNEL: FunnelStep[] = [
  {
    step: 1,
    title: 'Besök hemsidan',
    what: 'Sidvisningar, sessioner, UTM-källa, referer (egna data i Supabase).',
    where: 'Dashboard → Startsida-funnel + Besökare',
    href: '/admin/dashboard',
  },
  {
    step: 2,
    title: 'Hero / CTA-klick',
    what: 'Klick på huvudknappen. A/B-test: gul vs grön CTA + olika rubriker (vinnare: B, grön).',
    where: 'Hero A/B Analytics',
    href: '/admin/hero-analytics',
  },
  {
    step: 3,
    title: 'Avtalssida',
    what: 'Besök på /rorligt-avtal-v2, /rorligt-avtal eller /fastpris-avtal.',
    where: 'Dashboard → Startsida-funnel (steg 3)',
    href: '/admin/dashboard',
  },
  {
    step: 4,
    title: 'Affiliate-klick',
    what: 'Sista steget vi spårar på elchef.se – klick till leverantör. Varje klick får tracking-ID (elchef_ref).',
    where: 'Dashboard → Affiliate-klick',
    href: '/admin/dashboard',
  },
  {
    step: 5,
    title: 'Signerad kund (Salesys)',
    what: 'Faktiska registreringar hos leverantören. Syns i Salesys – inte automatiskt i vår admin ännu.',
    where: 'Salesys statistik (extern)',
    href: SALESYS_STATS_URL,
    external: true,
  },
];

type Source = {
  name: string;
  status: 'active' | 'partial' | 'missing';
  description: string;
  action?: string;
};

const SOURCES: Source[] = [
  {
    name: 'Egen tracking (Supabase)',
    status: 'active',
    description:
      'page_views, hero_clicks, affiliate_clicks, contract_clicks, form-fält, banner A/B. Det här är er huvudkälla för vad som fungerar på sajten.',
  },
  {
    name: 'Hero & Banner A/B',
    status: 'active',
    description:
      'Testar rubriker, knapptext och färger (t.ex. gul vs grön CTA). Resultat i Hero/Banner-analytics. Hero B (grön) är redan utsedd till vinnare.',
  },
  {
    name: 'Salesys',
    status: 'partial',
    description:
      'Visar vilka som faktiskt signerat upp. Kopplingen tillbaka till vilket affiliate-klick (elchef_ref) saknas – därför går det inte att se vilken leverantör/variant som ger flest riktiga kunder.',
    action: 'Jämför Salesys-datum med affiliate_clicks manuellt tills webhook finns.',
  },
  {
    name: 'Facebook & TikTok pixel',
    status: 'active',
    description:
      'Annonsspårning (PageView, Lead, ClickButton) efter Cookiebot-samtycke. Bra för ads – inte för sajtens funnel-analys.',
  },
  {
    name: 'Microsoft Clarity / heatmaps',
    status: 'missing',
    description:
      'Finns inte i koden. Ni har ingen Clarity/Hotjar som visar scroll, klickkartor eller hur länge folk tittar. Bing nämns bara som bot (Bingbot) som filtreras bort.',
    action: 'Lägg till Clarity om ni vill se heatmaps och session replays.',
  },
  {
    name: 'Google Analytics',
    status: 'missing',
    description:
      'Nämns i cookiepolicyn men är inte installerat. Session duration, bounce rate och användarflöden saknas därför som GA-rapporter.',
    action: 'Valfritt: lägg till GA4 parallellt med egen tracking.',
  },
];

const ACTIONS = [
  {
    title: '1. Kolla var folk tappar bort sig',
    body: 'Öppna Dashboard → Startsida-funnel. Jämför Startsida → Hero-klick → Avtalssida → Affiliate. Största droppen är där ni ska förbättra först.',
    href: '/admin/dashboard',
  },
  {
    title: '2. Räkna riktiga kunder',
    body: 'Öppna Salesys-statistiken och jämför antal signups med antal affiliate-klick samma period. Konvertering = signups ÷ affiliate-klick.',
    href: SALESYS_STATS_URL,
    external: true,
  },
  {
    title: '3. Se vilka knappar/texter som vinner',
    body: 'Hero A/B (färger + rubriker) och Banner A/B. Använd vinnaren konsekvent – och starta nästa test när ni har tillräckligt med data.',
    href: '/admin/hero-analytics',
  },
  {
    title: '4. Optimera avtalssidan',
    body: 'De flesta beslut tas på /rorligt-avtal-v2. Spåra vilka leverantörer som får flest klick i Dashboard. Placera vinnarna högst upp.',
    href: '/admin/dashboard',
  },
  {
    title: '5. Stäng loop till Salesys',
    body: 'Varje affiliate-klick har redan elchef_ref. När Salesys/leverantör skickar tillbaka det ID:t (webhook) kan admin visa vilka klick som blev kunder.',
    href: '/admin/data-verification',
  },
];

function statusLabel(status: Source['status']) {
  if (status === 'active') return { text: 'Aktiv', bg: '#dcfce7', color: '#166534' };
  if (status === 'partial') return { text: 'Delvis', bg: '#fef9c3', color: '#854d0e' };
  return { text: 'Saknas', bg: '#fee2e2', color: '#991b1b' };
}

export default function KonverteringPage() {
  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin" style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
          ← Admin
        </Link>
      </div>

      <h1 style={{ fontSize: '1.75rem', margin: '0 0 8px', color: '#0f172a' }}>
        Konverteringskarta
      </h1>
      <p style={{ margin: '0 0 28px', color: '#64748b', lineHeight: 1.6, maxWidth: 720 }}>
        Mål: bli kund = klicka affiliate-länk och byta elavtal. Här ser du vilken data ni redan har,
        var ni tittar, och vad som saknas för att öka konverteringen.
      </p>

      {/* Funnel */}
      <section
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#111827' }}>Kundresan (5 steg)</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
          Steg 1–4 sparas hos er. Steg 5 syns i Salesys.
        </p>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {FUNNEL.map((item) => (
            <li
              key={item.step}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto',
                gap: 16,
                alignItems: 'start',
                padding: 16,
                background: item.step === 5 ? '#f0fdf4' : '#f8fafc',
                borderRadius: 10,
                border: item.step === 5 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: item.step === 5 ? '#16a34a' : '#0f172a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{item.what}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Se: {item.where}</div>
              </div>
              {item.href ? (
                item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      alignSelf: 'center',
                      padding: '8px 12px',
                      background: '#16a34a',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Öppna Salesys →
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    style={{
                      alignSelf: 'center',
                      padding: '8px 12px',
                      background: '#0f172a',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Öppna →
                  </Link>
                )
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* Data sources */}
      <section
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '1.15rem', color: '#111827' }}>
          Vilken data har ni?
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {SOURCES.map((source) => {
            const badge = statusLabel(source.status);
            return (
              <div
                key={source.name}
                style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    marginBottom: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>{source.name}</strong>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.55 }}>
                  {source.description}
                </p>
                {source.action ? (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#0369a1' }}>
                    → {source.action}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <section
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#111827' }}>
          Gör så här för att öka konvertering
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
          Prioriterad ordning – börja med steg 1.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {ACTIONS.map((action) => (
            <div
              key={action.title}
              style={{
                padding: 16,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    {action.title}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.55 }}>
                    {action.body}
                  </p>
                </div>
                {action.external ? (
                  <a
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 12px',
                      background: '#16a34a',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Öppna →
                  </a>
                ) : (
                  <Link
                    href={action.href}
                    style={{
                      padding: '8px 12px',
                      background: '#0f172a',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Öppna →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
        Tips: Cookiepolicyn nämner Google Analytics, men GA är inte installerat. Det ni faktiskt
        använder för sajtanalys är er egen Supabase-tracking + admin-dashboardarna ovan.
      </p>
    </div>
  );
}
