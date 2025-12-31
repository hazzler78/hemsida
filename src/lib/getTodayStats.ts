import { createClient } from '@supabase/supabase-js';

/**
 * Hämtar statistik för idag
 */
export async function getTodayStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // Början av idag (00:00:00)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Totalt antal page views idag
  const { count: totalViews, error: viewsError } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  if (viewsError) {
    console.error('Error fetching today views:', viewsError);
  }

  // Besök per sida idag
  const { data: viewsByPathData, error: pathError } = await supabase
    .from('page_views')
    .select('path')
    .gte('created_at', todayISO);

  const pathCounts: Record<string, number> = {};
  viewsByPathData?.forEach(pv => {
    const path = pv.path || '(ingen path)';
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  });

  // Kontraktsklick idag
  const { count: contractClicks, error: clicksError } = await supabase
    .from('contract_clicks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  if (clicksError) {
    console.error('Error fetching today clicks:', clicksError);
  }

  // AI-analyser idag
  const { count: aiAnalyses, error: aiError } = await supabase
    .from('invoice_ocr')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  if (aiError) {
    console.error('Error fetching today AI analyses:', aiError);
  }

  return {
    totalViews: totalViews || 0,
    viewsByPath: pathCounts,
    contractClicks: contractClicks || 0,
    aiAnalyses: aiAnalyses || 0,
    date: todayStart.toLocaleDateString('sv-SE')
  };
}

/**
 * Hämtar enbart antal besök idag
 */
export async function getTodayVisits(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString());

  if (error) {
    console.error('Error fetching today visits:', error);
    return 0;
  }

  return count || 0;
}

