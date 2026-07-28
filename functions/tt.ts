/** Cloudflare Pages Function — reliable social short-link redirect */
export const onRequestGet: PagesFunction = async (context) => {
  const incoming = new URL(context.request.url);
  const dest = new URL('/fakturaanalys', incoming.origin);
  const defaults: Record<string, string> = {
    utm_source: 'tiktok',
    utm_medium: 'bio',
    utm_campaign: 'link_in_bio',
  };
  for (const [k, v] of Object.entries(defaults)) dest.searchParams.set(k, v);
  incoming.searchParams.forEach((v, k) => {
    if (v) dest.searchParams.set(k, v);
  });
  return Response.redirect(dest.toString(), 307);
};
