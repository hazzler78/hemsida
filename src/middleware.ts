import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Social short links (/ig, /fb, …) → /rorligt-avtal-v2 with UTM.
 * - Bare bio link gets sensible defaults (e.g. ig → instagram + bio)
 * - Extra query from Reel/CTA (utm_campaign, utm_content, …) is MERGED in
 *   (Next.js static redirects with ? in destination drop incoming query)
 */
const SOCIAL_SHORT: Record<
  string,
  { utm_source: string; utm_medium: string; utm_campaign?: string }
> = {
  ig: { utm_source: 'instagram', utm_medium: 'bio', utm_campaign: 'link_in_bio' },
  fb: { utm_source: 'facebook', utm_medium: 'bio', utm_campaign: 'link_in_bio' },
  yt: { utm_source: 'youtube', utm_medium: 'social', utm_campaign: 'link_in_bio' },
  tt: { utm_source: 'tiktok', utm_medium: 'bio', utm_campaign: 'link_in_bio' },
  pin: { utm_source: 'pinterest', utm_medium: 'social', utm_campaign: 'link_in_bio' },
  x: { utm_source: 'x', utm_medium: 'social', utm_campaign: 'link_in_bio' },
  in: { utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'link_in_bio' },
  snap: { utm_source: 'snapchat', utm_medium: 'social', utm_campaign: 'link_in_bio' },
};

export function middleware(request: NextRequest) {
  const segment = request.nextUrl.pathname.replace(/^\//, '').toLowerCase();
  const defaults = SOCIAL_SHORT[segment];
  if (!defaults) {
    return NextResponse.next();
  }

  const dest = request.nextUrl.clone();
  dest.pathname = '/fakturaanalys';
  dest.search = '';
  for (const [key, value] of Object.entries(defaults)) {
    if (value) dest.searchParams.set(key, value);
  }
  request.nextUrl.searchParams.forEach((value, key) => {
    if (value !== '') dest.searchParams.set(key, value);
  });
  if (!dest.searchParams.get('utm_source')) {
    dest.searchParams.set('utm_source', defaults.utm_source);
  }
  if (!dest.searchParams.get('utm_medium')) {
    dest.searchParams.set('utm_medium', defaults.utm_medium);
  }

  return NextResponse.redirect(dest, 307);
}

export const config = {
  matcher: ['/ig', '/fb', '/yt', '/tt', '/pin', '/x', '/in', '/snap'],
};
