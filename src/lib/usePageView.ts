import { useEffect } from 'react';

/**
 * Hook för att spåra sidvisningar med UTM-parametrar
 * @param path - Sökvägen för sidan (t.ex. '/', '/jamfor-elpriser')
 */
export function usePageView(path: string) {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      
      // Hämta eller skapa session ID
      const getSessionId = () => {
        try {
          const existing = localStorage.getItem('invoiceSessionId');
          if (existing) return existing;
          const generated = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
          localStorage.setItem('invoiceSessionId', generated);
          return generated;
        } catch {
          return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
        }
      };
      
      const sid = getSessionId();
      
      // Hämta UTM-parametrar från URL
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source') || undefined;
      const utmMedium = params.get('utm_medium') || undefined;
      const utmCampaign = params.get('utm_campaign') || undefined;
      // document.referrer innehåller var användaren kom ifrån (t.ex. facebook.com, instagram.com)
      const landingReferrer = typeof document.referrer === 'string' ? document.referrer : '';
      
      const payload = JSON.stringify({ 
        path, 
        sessionId: sid,
        utmSource,
        utmMedium,
        utmCampaign,
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

