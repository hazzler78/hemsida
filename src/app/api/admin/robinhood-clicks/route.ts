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

export async function GET(req: NextRequest) {
  try {
    // Get D1 database from environment
    const db: D1Database | undefined = (process.env as unknown as Env)?.DB;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'D1 database not configured',
        clicks: [],
        stats: { total: 0, today: 0, thisWeek: 0 },
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        refererStats: []
      });
    }

    // Get pagination parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalResult = await db.prepare(
      `SELECT COUNT(*) as total FROM robinhood_clicks`
    ).first();
    const total = (totalResult as { total?: number })?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get clicks with pagination
    const clicksResult = await db.prepare(
      `SELECT * FROM robinhood_clicks ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

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

    // Get referer statistics for the graph
    const refererResult = await db.prepare(
      `SELECT 
        CASE 
          WHEN referer IS NULL OR referer = '' THEN 'Direkt/Ingen referer'
          WHEN referer LIKE '%elchef%' THEN 'Elchef (intern)'
          WHEN referer LIKE '%google%' THEN 'Google'
          WHEN referer LIKE '%facebook%' THEN 'Facebook'
          WHEN referer LIKE '%twitter%' OR referer LIKE '%x.com%' THEN 'Twitter/X'
          WHEN referer LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN referer LIKE '%instagram%' THEN 'Instagram'
          WHEN referer LIKE '%tiktok%' THEN 'TikTok'
          WHEN referer LIKE '%bing%' THEN 'Bing'
          WHEN referer LIKE '%duckduckgo%' THEN 'DuckDuckGo'
          ELSE 'Övriga'
        END as source,
        COUNT(*) as count
       FROM robinhood_clicks
       GROUP BY source
       ORDER BY count DESC`
    ).all();

    const refererStats = (refererResult.results || []).map((r: any) => ({
      source: r.source || 'Okänd',
      count: r.count || 0
    }));

    return NextResponse.json({ 
      clicks,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      refererStats
    });
  } catch (error) {
    console.error('Error fetching robinhood clicks:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      clicks: [],
      stats: { total: 0, today: 0, thisWeek: 0 },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      refererStats: []
    }, { status: 500 });
  }
}

export const runtime = 'edge';
