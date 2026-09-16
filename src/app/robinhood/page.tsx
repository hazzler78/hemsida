'use client';

import { useEffect } from 'react';

const DEFAULT_UTM = {
  utm_source: 'hampus',
  utm_medium: 'share',
  utm_campaign: 'robinhood',
} as const;

/**
 * Hampus delningslänk: https://www.elchef.se/robinhood
 * - Sparar came_via_robinhood (affiliate-insikter)
 * - Loggar besöket till BÅDE D1 (/api/track/robinhood) och Supabase page_views
 *   så Hampus-trafiken mäts i samma tabell som norsk trafik (path=/robinhood)
 * - Vidarebefordrar utm_content så Hampus kan tagga enskilda inlägg
 * - Skickar besökaren till /fakturaanalys med UTM
 */
export default function RobinhoodPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('came_via_robinhood', 'true');
      localStorage.setItem('came_via_robinhood_time', Date.now().toString());
    } catch { /* ignore */ }

    // Session-id (samma nyckel som analyssidan använder)
    let sid = '';
    try {
      sid = localStorage.getItem('invoiceSessionId') || '';
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('invoiceSessionId', sid);
      }
    } catch { /* ignore */ }

    const incoming = new URLSearchParams(window.location.search);
    const utmContent = incoming.get('utm_content') || null;

    // 1) D1-spårning (behålls — affiliate-insikter)
    const trackD1 = async () => {
      try {
        await fetch('/api/track/robinhood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referer: document.referrer || '',
            userAgent: navigator.userAgent || '',
            source: 'hampus',
            campaign: 'robinhood',
          }),
        });
      } catch (error) {
        console.error('Failed to track click:', error);
      }
    };

    // 2) Supabase page_views (konsekvent med norska /robinhood)
    const trackSupabase = () => {
      try {
        const payload = JSON.stringify({
          path: '/robinhood',
          sessionId: sid,
          utmSource: DEFAULT_UTM.utm_source,
          utmMedium: DEFAULT_UTM.utm_medium,
          utmCampaign: DEFAULT_UTM.utm_campaign,
          utmContent,
          referrer: document.referrer || '',
        });
        const url = '/api/events/page-view';
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch { /* ignore */ }
    };

    // Bygg mål-URL: /fakturaanalys med Hampus-UTM (behåll inkommande parametrar)
    const dest = new URL('/fakturaanalys', window.location.origin);
    for (const [key, value] of Object.entries(DEFAULT_UTM)) {
      dest.searchParams.set(key, value);
    }
    incoming.forEach((value, key) => {
      if (value) dest.searchParams.set(key, value);
    });
    if (!dest.searchParams.get('utm_source')) {
      dest.searchParams.set('utm_source', DEFAULT_UTM.utm_source);
    }
    if (!dest.searchParams.get('utm_medium')) {
      dest.searchParams.set('utm_medium', DEFAULT_UTM.utm_medium);
    }
    if (!dest.searchParams.get('utm_campaign')) {
      dest.searchParams.set('utm_campaign', DEFAULT_UTM.utm_campaign);
    }

    trackSupabase();
    void trackD1().finally(() => {
      window.location.replace(dest.pathname + dest.search);
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <p>Omdirigerar…</p>
    </div>
  );
}
