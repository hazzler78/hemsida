import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'edge';

const ADMIN_PASSWORD = process.env.ADMIN_DASHBOARD_PASSWORD || 'grodan2025';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-password');
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fromISO = req.nextUrl.searchParams.get('from');
    if (!fromISO) {
      return NextResponse.json(
        { error: 'Missing query parameter: from (ISO date)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { count: formSubmissions } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromISO);

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('subscribe_newsletter')
      .gte('created_at', fromISO);

    const newsletterSubs = contactsData?.filter((c) => c.subscribe_newsletter).length ?? 0;

    const { data: contactRequests } = await supabase
      .from('contacts')
      .select('id, name, email, phone, message, form_type, ref, campaign_code, created_at')
      .gte('created_at', fromISO)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: newsletterSubscriptions } = await supabase
      .from('contacts')
      .select('id, email, ref, campaign_code, created_at')
      .eq('subscribe_newsletter', true)
      .gte('created_at', fromISO)
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({
      formSubmissions: formSubmissions ?? 0,
      newsletterSubs,
      contactRequests: contactRequests ?? [],
      newsletterSubscriptions: newsletterSubscriptions ?? [],
    });
  } catch (e) {
    console.error('Error fetching admin contacts stats:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
