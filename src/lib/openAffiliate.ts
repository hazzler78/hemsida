/**
 * Öppnar affiliate-länk. Försöker ny flik; om popup blockeras (vanligt på mobil)
 * faller vi tillbaka till samma flik så användaren inte fastnar utan feedback.
 */
export function openAffiliateUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed) {
      window.location.assign(url);
    }
  } catch {
    window.location.assign(url);
  }
}
