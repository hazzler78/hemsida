# Social click attribution (Facebook Reels → sajt)

## Mål
Veta **vilken Reel** som drev landning och kontraktsklick — inte bara "facebook generellt".

## Kedja
1. n8n skapar unik `tracking_code` per post (`fb_reel_{tema}_{...}`)
2. CTA-länk i FB-kommentar:
   `https://www.elchef.se/rorligt-avtal-v2?utm_source=facebook&utm_medium=reel&utm_campaign={tema}&utm_content={tracking_code}`
   (tidigare `/fakturaanalys` — OCR-väggen läckte; social går nu till jämförelse/byt)
3. `social_posts` sparar `tracking_code` + full `cta_url`
4. Sajten loggar UTM i `page_views` (inkl. `utm_content`)
5. First-touch UTM sparas i session → kontraktsklick på `/rorligt-avtal-v2` behåller källan
6. View `social_post_performance` summerar views + landningar + kontraktsklick per post

## SQL (kör i Supabase)
```
supabase-social-click-attribution.sql
```
(lokal kopia: `Documents/Elchef/supabase-social-click-attribution.sql`)

## Deploy
Merge/deploy hemsida-PR så `usePageView` + API skickar `utm_content`.

## Kolla resultat
```sql
select theme, tracking_code, latest_views, landing_page_views, contract_clicks_count, posted_at
from social_post_performance
order by posted_at desc
limit 20;
```

```sql
select path, utm_source, utm_medium, utm_campaign, utm_content, created_at
from page_views
where utm_source = 'facebook'
order by created_at desc
limit 20;
```
