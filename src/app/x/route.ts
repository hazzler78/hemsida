import type { NextRequest } from 'next/server';
import { socialShortRedirect } from '@/lib/socialShortRedirect';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  return socialShortRedirect(request, {
    utm_source: 'x',
    utm_medium: 'social',
    utm_campaign: 'link_in_bio',
  });
}
