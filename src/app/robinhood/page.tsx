'use client';

import { useEffect } from 'react';

const DEFAULT_UTM = {
  utm_source: 'hampus',
  utm_medium: 'share',
  utm_campaign: 'robinhood',
} as const;

/**
 * Hampus share link: https://www.elchef.se/robinhood
 * - Marks came_via_robinhood (affiliate conversion)
 * - Logs click to D1
 * - Sends visitor to fakturaanalys with UTM so insights show Hampus
 */
export default function RobinhoodPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('came_via_robinhood', 'true');
    localStorage.setItem('came_via_robinhood_time', Date.now().toString());

    const trackClick = async () => {
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

    const incoming = new URLSearchParams(window.location.search);
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

    void trackClick().finally(() => {
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
