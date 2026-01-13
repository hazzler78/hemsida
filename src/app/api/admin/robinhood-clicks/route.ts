import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    // Get D1 database from environment
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured',
        clicks: [],
        stats: { total: 0, today: 0, thisWeek: 0 }
      });
    }

    // Get all clicks ordered by most recent
    const clicksResult = await db.prepare(
      `SELECT * FROM robinhood_clicks ORDER BY created_at DESC LIMIT 100`
    ).all();

    const clicks = clicksResult.results || [];

    // Calculate statistics
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const weekStart = todayStart - (7 * 24 * 60 * 60);

    const statsResult = await db.prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as this_week
       FROM robinhood_clicks`
    ).bind(todayStart, weekStart).first();

    // Type assertion for D1 query result
    const statsData = statsResult as { total?: number; today?: number; this_week?: number } | null;

    const stats = {
      total: statsData?.total || 0,
      today: statsData?.today || 0,
      thisWeek: statsData?.this_week || 0,
    };

    return NextResponse.json({ 
      clicks,
      stats 
    });
  } catch (error) {
    console.error('Error fetching robinhood clicks:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      clicks: [],
      stats: { total: 0, today: 0, thisWeek: 0 }
    }, { status: 500 });
  }
}

export const runtime = 'edge';
