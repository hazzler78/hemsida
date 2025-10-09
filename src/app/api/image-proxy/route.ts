import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const src = request.nextUrl.searchParams.get('src');
    if (!src) return new NextResponse('Missing src', { status: 400 });

    // Basic allowlist: only http/https
    if (!/^https?:\/\//i.test(src)) return new NextResponse('Invalid src', { status: 400 });

    const upstream = await fetch(src, { headers: { 'User-Agent': 'elchef-image-proxy/1.0' } });
    if (!upstream.ok) return new NextResponse('Upstream error', { status: upstream.status });

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const bytes = await upstream.arrayBuffer();
    const resp = new NextResponse(bytes, { status: 200 });
    resp.headers.set('content-type', contentType);
    resp.headers.set('cache-control', 'public, max-age=3600');
    return resp;
  } catch {
    return new NextResponse('Proxy error', { status: 500 });
  }
}


