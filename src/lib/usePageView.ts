import { useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/sessionId';
import { getAttributionUtm, getUTMParams, persistFirstTouchUtm } from '@/lib/utm';

/**
 * Hook för att spåra sidvisningar med UTM-parametrar
 * @param path - Sökvägen för sidan (t.ex. '/', '/jamfor-elpriser')
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

      // document.referrer innehåller var användaren kom ifrån (t.ex. facebook.com, instagram.com)
      const landingReferrer = typeof document.referrer === 'string' ? document.referrer : '';
      
      const payload = JSON.stringify({ 
        path, 
        sessionId: sid,
        utmSource: utm.utm_source,
        utmMedium: utm.utm_medium,
        utmCampaign: utm.utm_campaign,
        utmContent: utm.utm_content,
        referrer: landingReferrer
      });
      
      const url = '/api/events/page-view';
      
      // Använd sendBeacon om tillgängligt (mer tillförlitligt)
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: payload 
        }).catch(() => {});
      }
    } catch {
      // Tyst hantering av fel - tracking får inte störa användarupplevelsen
    }
  }, [path]);
}

