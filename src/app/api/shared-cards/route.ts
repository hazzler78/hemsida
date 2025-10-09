import { NextRequest, NextResponse } from 'next/server';
// removed unused createClient
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Supabase client is created per-request via helper

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 100);
    const { data, error } = await supabase
      .from('shared_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Strip basic markdown to plain text (bold, italics, links, lists)
function stripMarkdown(md: string): string {
  if (!md) return '';
  let text = md;
  text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // bold
  text = text.replace(/\*(.+?)\*/g, '$1'); // italics
  text = text.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)'); // links
  text = text.replace(/^\s*-\s+/gm, '• '); // lists to bullets
  return text.trim();
}

// POST: normalize a card's summary to plain text
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { url, id } = body || {};
    if (!url && !id) {
      return NextResponse.json({ error: 'Provide url or id' }, { status: 400 });
    }

    const query = supabase.from('shared_cards').select('*').limit(1);
    const { data, error } = id ? await query.eq('id', id) : await query.eq('url', url);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const card = data[0] as { id: number; summary: string };
    const cleaned = stripMarkdown(card.summary || '');
    const { error: upErr } = await supabase
      .from('shared_cards')
      .update({ summary: cleaned })
      .eq('id', card.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ success: true, id: card.id });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: update title/summary/url/image_url
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { id, title, summary, url, image_url } = body || {};
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const payload: { title?: string; summary?: string; url?: string; image_url?: string | null } = {};
    if (title !== undefined) payload.title = title;
    if (summary !== undefined) payload.summary = summary;
    if (url !== undefined) payload.url = url;
    if (image_url !== undefined) payload.image_url = image_url;
    const { error } = await supabase.from('shared_cards').update(payload).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove by id
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('shared_cards').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';


