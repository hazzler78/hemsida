import type { NextRequest } from 'next/server';
import { socialShortRedirect } from '@/lib/socialShortRedirect';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  return socialShortRedirect(request, {
    utm_source: 'facebook',
    utm_medium: 'bio',
    utm_campaign: 'link_in_bio',
  });
}
