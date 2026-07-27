import { useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/sessionId';
import { getAttributionUtm, getUTMParams, persistFirstTouchUtm } from '@/lib/utm';

/**
 * Hook för att spåra sidvisningar med UTM-parametrar (inkl. utm_content + first-touch).
 */
export function usePageView(path: string) {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const sid = getOrCreateSessionId();

      // First-touch: spara landningens UTM så CTA längre in i funnel behåller källan
      const urlUtm = getUTMParams();
      persistFirstTouchUtm(urlUtm);
      const utm = getAttributionUtm();

      const landingReferrer = typeof document.referrer === 'string' ? document.referrer : '';

      const payload = JSON.stringify({
        path,
        sessionId: sid,
        utmSource: utm.utm_source,
        utmMedium: utm.utm_medium,
        utmCampaign: utm.utm_campaign,
        utmContent: utm.utm_content,
        referrer: landingReferrer,
      });

      const url = '/api/events/page-view';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }).catch(() => {});
      }
    } catch {
      /* tracking får inte störa UX */
    }
  }, [path]);
}
