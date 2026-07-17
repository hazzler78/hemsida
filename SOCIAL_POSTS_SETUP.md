# Social posts + insights (Facebook/Reels)

## Vad
Två tabeller i Supabase:

| Tabell | Syfte |
|--------|--------|
| `social_posts` | Logg per publicerat inlägg (tema, caption, post_id, CTA) |
| `social_post_insights` | Metrics-snapshots över tid (views, reach, reactions…) |
| View `social_posts_with_latest_insights` | Post + senaste snapshot |

## Kör migration
1. Öppna [Supabase SQL Editor](https://supabase.com/dashboard)
2. Kör hela `supabase-social-posts.sql`
3. Verifiera:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('social_posts', 'social_post_insights');
```

## Logga en post (REST / n8n)
`POST /rest/v1/social_posts` med anon- eller service-key:

```json
{
  "platform": "facebook",
  "format": "reel_video_9x16",
  "page_id": "606142289256675",
  "post_id": "1408550801180814",
  "post_url": "https://www.facebook.com/606142289256675/videos/1408550801180814",
  "theme": "Fast vs rörligt",
  "theme_id": "fixed_vs_spot",
  "core_message": "…",
  "caption": "…",
  "cta_url": "https://www.elchef.se/fakturaanalys",
  "workflow_id": "llkNch90Ng9yEI4A",
  "status": "posted",
  "posted_at": "2026-07-17T09:28:47.541Z"
}
```

Upsert: header `Prefer: resolution=merge-duplicates` + unique `(platform, post_id)`.

## Insights (senare / cron)
`POST /rest/v1/social_post_insights` med t.ex. `views`, `reach`, `reactions`, `raw`.

Hämta från Facebook Graph (`/{post-id}/insights`) i separat n8n-flöde.

## Koppling till n8n
Elchef — Facebook Reels (autonom v1) ska POST:a till `social_posts` efter `Mark Posted`.
