import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
function getSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
function getSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function fetchImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'elchef-backfill/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const og = html.match(/<meta[^>]+property=["']og:image(:secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const linkImg = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/i);
    const firstImg = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    let img = (og && og[2]) || (tw && tw[1]) || (linkImg && linkImg[1]) || (firstImg && firstImg[1]) || null;
    if (img && img.startsWith('//')) {
      const base = new URL(url);
      img = `${base.protocol}${img}`;
    } else if (img && !img.startsWith('http')) {
      const base = new URL(url);
      img = new URL(img, base.origin).href;
    }
    return img;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from('shared_cards')
      .select('id,url')
      .is('image_url', null)
      .limit(50);
    if (!data || data.length === 0) return NextResponse.json({ updated: 0 });

    let updated = 0;
    for (const row of data) {
      const img = await fetchImage(row.url as string);
      if (img) {
        const { error } = await supabase.from('shared_cards').update({ image_url: img }).eq('id', row.id);
        if (!error) updated += 1;
      }
    }
    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


