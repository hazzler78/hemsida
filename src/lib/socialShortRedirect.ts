import { NextResponse } from 'next/server';

type Defaults = {
  utm_source: string;
  utm_medium: string;
  utm_campaign?: string;
};

/** Merge default UTM with request query (request wins on key clash). */
export function socialShortRedirect(request: Request, defaults: Defaults): NextResponse {
  const incoming = new URL(request.url);
  // Social traffic converts better on compare/switch than OCR-first fakturaanalys.
  const dest = new URL('/rorligt-avtal-v2', incoming.origin);

  for (const [key, value] of Object.entries(defaults)) {
    if (value) dest.searchParams.set(key, value);
  }
  incoming.searchParams.forEach((value, key) => {
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
