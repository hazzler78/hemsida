import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_PASSWORD } from '@/lib/adminAuth';
import { HUMAN_PAGE_VIEW_OR } from '@/lib/homepageFunnel';
import {
  CONVERSION_EXPERIMENT,
  rate,
  type ConversionMetrics,
  type ConversionSnapshotRow,
} from '@/lib/conversionExperiment';

export const runtime = 'edge';

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.replace(/^"|"$/g, '');
}

function getSupabase() {
  const url = sanitizeEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = sanitizeEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countExact(supabase: any, table: string, apply: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  q = apply(q) ?? q;
  const { count, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function computeMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  fromIso: string,
  toIso: string,
  windowDays: number
): Promise<ConversionMetrics> {
  const homepageViews = await countExact(supabase, 'page_views', (q) =>
    q.eq('path', '/').or(HUMAN_PAGE_VIEW_OR).gte('created_at', fromIso).lt('created_at', toIso)
  );

  const heroClicks = await countExact(supabase, 'hero_clicks', (q) =>
    q.gte('created_at', fromIso).lt('created_at', toIso)
  );

  const contractV2 = await countExact(supabase, 'page_views', (q) =>
    q
      .eq('path', '/rorligt-avtal-v2')
      .or(HUMAN_PAGE_VIEW_OR)
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
  );
  const contractV1 = await countExact(supabase, 'page_views', (q) =>
    q
      .eq('path', '/rorligt-avtal')
      .or(HUMAN_PAGE_VIEW_OR)
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
  );
  const contractPageViews = contractV1 + contractV2;

  const affiliateClicks = await countExact(supabase, 'affiliate_clicks', (q) =>
    q.eq('contract_type', 'rorligt').gte('created_at', fromIso).lt('created_at', toIso)
  );

  const affiliateClicksV2 = await countExact(supabase, 'affiliate_clicks', (q) =>
    q
      .eq('contract_type', 'rorligt')
      .eq('source', 'rorligt-avtal-v2')
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
  );

  return {
    windowDays,
    from: fromIso,
    to: toIso,
    homepageViews,
    heroClicks,
    contractPageViews,
    affiliateClicks,
    affiliateClicksV2,
    contractToAffiliateRate: rate(affiliateClicks, contractPageViews),
    homepageToAffiliateRate: rate(affiliateClicks, homepageViews),
    homepageToHeroRate: rate(heroClicks, homepageViews),
  };
}

async function listSnapshots(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{ rows: ConversionSnapshotRow[]; tableReady: boolean }> {
  const { data, error } = await supabase
    .from('conversion_experiment_snapshots')
    .select('*')
    .eq('experiment_id', CONVERSION_EXPERIMENT.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    const missing =
      error.message?.includes('conversion_experiment_snapshots') ||
      error.message?.includes('schema cache') ||
      error.code === '42P01' ||
      error.code === 'PGRST205';
    if (missing) {
      return { rows: [], tableReady: false };
    }
    throw new Error(error.message);
  }
  return { rows: (data || []) as ConversionSnapshotRow[], tableReady: true };
}

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const windowDays = Number(
      req.nextUrl.searchParams.get('days') || CONVERSION_EXPERIMENT.defaultWindowDays
    );
    const days = windowDays === 7 ? 7 : 14;
    const now = new Date();
    const toIso = now.toISOString();
    const fromIso = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    let snapshots: ConversionSnapshotRow[] = [];
    let tableReady = true;
    try {
      const listed = await listSnapshots(supabase);
      snapshots = listed.rows;
      tableReady = listed.tableReady;
    } catch (e) {
      tableReady = false;
      snapshots = [];
      console.warn('conversion snapshots list:', e);
    }

    const liveStart = snapshots.find((s) => s.kind === 'live_start');
    const baseline =
      snapshots.find((s) => s.kind === 'baseline' && s.window_days === days) ||
      snapshots.find((s) => s.kind === 'baseline');

    const current = await computeMetrics(supabase, fromIso, toIso, days);

    let after: ConversionMetrics | null = null;
    if (liveStart?.created_at) {
      const liveFrom = new Date(liveStart.created_at);
      const liveTo = new Date(liveFrom.getTime() + days * 24 * 60 * 60 * 1000);
      const end = liveTo.getTime() > now.getTime() ? now : liveTo;
      after = await computeMetrics(supabase, liveFrom.toISOString(), end.toISOString(), days);
    }

    return NextResponse.json({
      ok: true,
      experiment: CONVERSION_EXPERIMENT,
      tableReady,
      tableExistsHint: tableReady
        ? undefined
        : 'Kör supabase-conversion-experiments.sql i Supabase om sparande misslyckas.',
      windowDays: days,
      current,
      baseline: baseline || null,
      liveStart: liveStart || null,
      after,
      snapshots,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    console.error('conversion-experiment GET', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env saknas' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const days = body.days === 7 ? 7 : 14;
    const notes = typeof body.notes === 'string' ? body.notes : null;

    const now = new Date();
    const toIso = now.toISOString();
    const fromIso = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    if (action === 'save_baseline') {
      const metrics = await computeMetrics(supabase, fromIso, toIso, days);
      const row = {
        experiment_id: CONVERSION_EXPERIMENT.id,
        kind: 'baseline' as const,
        label: `Baseline senaste ${days} dagarna`,
        window_days: days,
        period_from: fromIso,
        period_to: toIso,
        metrics,
        notes:
          notes ||
          'Sparad före/vid deploy av hoppa-över + featured CTA + popup-fallback.',
      };

      const { data, error } = await supabase
        .from('conversion_experiment_snapshots')
        .insert(row)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
            hint: 'Kör supabase-conversion-experiments.sql i Supabase SQL Editor, försök sedan igen.',
            metrics,
            row,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, snapshot: data, metrics });
    }

    if (action === 'mark_live') {
      const metrics = await computeMetrics(supabase, fromIso, toIso, days);
      const row = {
        experiment_id: CONVERSION_EXPERIMENT.id,
        kind: 'live_start' as const,
        label: 'Ändringen är live i produktion',
        window_days: days,
        period_from: toIso,
        period_to: toIso,
        metrics,
        notes: notes || 'Startpunkt för efter-mätning.',
      };

      const { data, error } = await supabase
        .from('conversion_experiment_snapshots')
        .insert(row)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
            hint: 'Kör supabase-conversion-experiments.sql i Supabase SQL Editor, försök sedan igen.',
            metrics,
            row,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, snapshot: data, metrics });
    }

    if (action === 'save_checkpoint') {
      const metrics = await computeMetrics(supabase, fromIso, toIso, days);
      const row = {
        experiment_id: CONVERSION_EXPERIMENT.id,
        kind: 'checkpoint' as const,
        label: `Checkpoint senaste ${days} dagarna`,
        window_days: days,
        period_from: fromIso,
        period_to: toIso,
        metrics,
        notes,
      };

      const { data, error } = await supabase
        .from('conversion_experiment_snapshots')
        .insert(row)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
            hint: 'Kör supabase-conversion-experiments.sql i Supabase SQL Editor.',
            metrics,
            row,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, snapshot: data, metrics });
    }

    return NextResponse.json({ error: 'Okänd action' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Okänt fel';
    console.error('conversion-experiment POST', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
