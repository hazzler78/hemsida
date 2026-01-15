import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const refererStatsResults = (refererResult.results || []) as Array<{ source?: string; count?: number }>;
    const refererStats = refererStatsResults.map((r) => ({
      source: r.source || 'Okänd',
      count: r.count || 0
    }));

    // Get affiliate clicks from Supabase for conversion statistics
    let affiliateStats = {
      total: 0,
      today: 0,
      thisWeek: 0,
      conversionRate: 0,
      conversionRateToday: 0,
      conversionRateThisWeek: 0,
      trackingStartDate: null as string | null,
      robinhoodVisitorsSinceTracking: 0,
      conversionRateSinceTracking: 0,
    };

    try {
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Find when we started tracking came_via_robinhood (first affiliate click with this flag)
        const { data: firstTracking } = await supabase
          .from('affiliate_clicks')
          .select('created_at')
          .eq('came_via_robinhood', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        const trackingStartDate = firstTracking?.created_at || null;
        const trackingStartTimestamp = trackingStartDate 
          ? Math.floor(new Date(trackingStartDate).getTime() / 1000)
          : null;

        // Calculate date ranges (Supabase uses ISO timestamps)
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(todayStart.getTime() - (7 * 24 * 60 * 60 * 1000));

        // Get total affiliate clicks FROM ROBINHOOD VISITORS ONLY
        const { count: totalAffiliate } = await supabase
          .from('affiliate_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('came_via_robinhood', true);

        // Get today's affiliate clicks FROM ROBINHOOD VISITORS ONLY
        const { count: todayAffiliate } = await supabase
          .from('affiliate_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('came_via_robinhood', true)
          .gte('created_at', todayStart.toISOString());

        // Get this week's affiliate clicks FROM ROBINHOOD VISITORS ONLY
        const { count: weekAffiliate } = await supabase
          .from('affiliate_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('came_via_robinhood', true)
          .gte('created_at', weekStart.toISOString());

        // Get robinhood visitors SINCE tracking started (for accurate conversion rate)
        let robinhoodVisitorsSinceTracking = 0;
        if (trackingStartTimestamp) {
          const visitorsSinceTrackingResult = await db.prepare(
            `SELECT COUNT(*) as total FROM robinhood_clicks WHERE created_at >= ?`
          ).bind(trackingStartTimestamp).first();
          robinhoodVisitorsSinceTracking = (visitorsSinceTrackingResult as { total?: number })?.total || 0;
        }

        affiliateStats = {
          total: totalAffiliate || 0,
          today: todayAffiliate || 0,
          thisWeek: weekAffiliate || 0,
          conversionRate: stats.total > 0 ? ((totalAffiliate || 0) / stats.total * 100) : 0,
          conversionRateToday: stats.today > 0 ? ((todayAffiliate || 0) / stats.today * 100) : 0,
          conversionRateThisWeek: stats.thisWeek > 0 ? ((weekAffiliate || 0) / stats.thisWeek * 100) : 0,
          trackingStartDate: trackingStartDate,
          robinhoodVisitorsSinceTracking: robinhoodVisitorsSinceTracking,
          conversionRateSinceTracking: robinhoodVisitorsSinceTracking > 0 
            ? ((totalAffiliate || 0) / robinhoodVisitorsSinceTracking * 100) 
            : 0,
        };
      }
    } catch (error) {
      console.error('Error fetching affiliate clicks:', error);
      // Continue without affiliate stats if Supabase is not available
    }

    return NextResponse.json({ 
      clicks,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      refererStats,
      affiliateStats
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
