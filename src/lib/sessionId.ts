/**
 * En session-id för hela besöket – synkas till båda localStorage-nycklar
 * så page_views, hero, affiliate och kontraktsflöden kan kopplas ihop.
 */
const PRIMARY_KEY = 'invoiceSessionId';
const LEGACY_KEY = 'invoice_session_id';

function generateSessionId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** Läs befintlig id från valfri lagrad nyckel eller URL (?sid=). */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('sid')?.trim();
    if (fromUrl) {
      window.localStorage.setItem(PRIMARY_KEY, fromUrl);
      window.localStorage.setItem(LEGACY_KEY, fromUrl);
      return fromUrl;
    }

    const existing =
      window.localStorage.getItem(PRIMARY_KEY) ||
      window.localStorage.getItem(LEGACY_KEY) ||
      '';
    if (existing) {
      window.localStorage.setItem(PRIMARY_KEY, existing);
      window.localStorage.setItem(LEGACY_KEY, existing);
      return existing;
    }

    const generated = generateSessionId();
    window.localStorage.setItem(PRIMARY_KEY, generated);
    window.localStorage.setItem(LEGACY_KEY, generated);
    return generated;
  } catch {
    return generateSessionId();
  }
}

/** Anropas t.ex. från /tack när Salesys skickar tillbaka ?sid= */
export function persistSessionId(sessionId: string): void {
  if (typeof window === 'undefined' || !sessionId.trim()) return;
  try {
    const id = sessionId.trim();
    window.localStorage.setItem(PRIMARY_KEY, id);
    window.localStorage.setItem(LEGACY_KEY, id);
  } catch {
    /* no-op */
  }
}
