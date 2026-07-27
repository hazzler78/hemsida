/**
 * Client helper for funnel step tracking (landing → OCR → contract).
 */
import { getOrCreateSessionId } from '@/lib/sessionId';
import { getFirstTouchUtm, type UtmParams } from '@/lib/utm';

export type FunnelEventName =
  | 'landing_fakturaanalys'
  | 'ocr_started'
  | 'ocr_completed'
  | 'ocr_failed'
  | 'contract_click';

export function trackFunnelEvent(
  event: FunnelEventName,
  extra?: { path?: string; meta?: Record<string, unknown> }
): void {
  try {
    if (typeof window === 'undefined') return;
    const utm: UtmParams = getFirstTouchUtm();
    const payload = JSON.stringify({
      event,
      path: extra?.path || window.location.pathname,
      sessionId: getOrCreateSessionId(),
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmContent: utm.utm_content,
      meta: extra?.meta || null,
    });
    const url = '/api/events/funnel';
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
    /* tracking must never break UX */
  }
}
