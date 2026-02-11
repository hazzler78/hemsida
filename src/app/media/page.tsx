import { getSupabaseServerClient } from '@/lib/supabaseServer';
import MediaClient, { type SharedCard } from './MediaClient';

export const dynamic = 'force-dynamic';

async function fetchSharedCards(): Promise<SharedCard[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('shared_cards')
      .select('id, title, summary, url, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching shared cards:', error);
      return [];
    }
    return (data || []) as SharedCard[];
  } catch (e) {
    console.error('Exception fetching shared cards:', e);
    return [];
  }
}

export default async function MediaPage() {
  const cards = await fetchSharedCards();

  return <MediaClient initialCards={cards} />;
}
