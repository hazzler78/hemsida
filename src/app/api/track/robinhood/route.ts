import { NextRequest, NextResponse } from 'next/server';

// Type definition for Cloudflare D1 database
// D1Database is available in Cloudflare runtime but not in TypeScript types during build
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first(): Promise<unknown>;
  all(): Promise<{ results: unknown[] }>;
  run(): Promise<{ meta: { last_row_id: number } }>;
}

interface Env {
  DB?: D1Database;
}

export async function POST(req: NextRequest) {
  try {
    // Get D1 database from environment (available in Cloudflare Pages)
    // In Cloudflare Pages with @cloudflare/next-on-pages, D1 is available via process.env.DB
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      console.error('D1 database not available - make sure DB binding is configured in wrangler.toml');
      // Return success to not break the redirect flow
      return NextResponse.json({ ok: true, note: 'D1 not configured' });
    }

    const body = await req.json().catch(() => ({}));
    const { referer, userAgent } = body;

    // Get client IP (Cloudflare provides this in CF-Connecting-IP header)
    const ipAddress = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     'unknown';

    // Generate a simple session ID from IP and timestamp
    const sessionId = `${ipAddress}-${Date.now()}`;

    // Insert click into D1 database
    const result = await db.prepare(
      `INSERT INTO robinhood_clicks (user_agent, referer, ip_address, session_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userAgent || null,
      referer || null,
      ipAddress || null,
      sessionId || null,
      Math.floor(Date.now() / 1000) // Unix timestamp
    ).run();

    return NextResponse.json({ 
      ok: true, 
      id: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Error tracking robinhood click:', error);
    // Return success to not break the redirect flow
    return NextResponse.json({ 
      ok: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export const runtime = 'edge';
