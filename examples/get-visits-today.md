# Hur man hämtar antal besök idag

## 1. I JavaScript/TypeScript (Supabase Client)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Skapa datum för början av idag (00:00:00)
const today = new Date();
today.setHours(0, 0, 0, 0); // Sätt till början av dagen
const todayISO = today.toISOString();

// Hämta antal page views idag
const { count, error } = await supabase
  .from('page_views')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', todayISO);

console.log(`Antal besök idag: ${count || 0}`);
```

## 2. Med specifik sida

```typescript
// Antal besök på en specifik sida idag
const { count } = await supabase
  .from('page_views')
  .select('*', { count: 'exact', head: true })
  .eq('path', '/jamfor-elpriser')
  .gte('created_at', todayISO);
```

## 3. Med detaljerad data (alla rader)

```typescript
// Hämta alla page views idag med detaljer
const { data, error } = await supabase
  .from('page_views')
  .select('*')
  .gte('created_at', todayISO)
  .order('created_at', { ascending: false });

console.log(`Antal besök idag: ${data?.length || 0}`);
```

## 4. SQL-fråga direkt i Supabase

```sql
-- Antal besök idag
SELECT COUNT(*) 
FROM page_views 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- Med detaljer per sida
SELECT 
  path,
  COUNT(*) as antal_besok
FROM page_views 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
GROUP BY path
ORDER BY antal_besok DESC;
```

## 5. Komplett funktion för att hämta idag-statistik

```typescript
async function getTodayStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // Början av idag
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Totalt antal besök idag
  const { count: totalViews } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  // Besök per sida idag
  const { data: viewsByPath } = await supabase
    .from('page_views')
    .select('path')
    .gte('created_at', todayISO);

  const pathCounts: Record<string, number> = {};
  viewsByPath?.forEach(pv => {
    const path = pv.path || '(ingen path)';
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  });

  // Kontraktsklick idag
  const { count: contractClicks } = await supabase
    .from('contract_clicks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  return {
    totalViews: totalViews || 0,
    viewsByPath: pathCounts,
    contractClicks: contractClicks || 0
  };
}
```

## 6. Med tidszon-hantering (för svensk tid)

```typescript
// För svensk tidszon (UTC+1 eller UTC+2)
function getTodayStartSwedish() {
  const now = new Date();
  // Konvertera till svensk tid
  const swedishTime = new Date(now.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
  swedishTime.setHours(0, 0, 0, 0);
  
  // Konvertera tillbaka till UTC för Supabase
  const offset = now.getTime() - swedishTime.getTime();
  const utcDate = new Date(swedishTime.getTime() - offset);
  
  return utcDate.toISOString();
}

const todayISO = getTodayStartSwedish();
```

## Användning i React-komponent

```typescript
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TodayStats() {
  const [visitsToday, setVisitsToday] = useState(0);

  useEffect(() => {
    async function fetchTodayVisits() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setVisitsToday(count || 0);
    }

    fetchTodayVisits();
  }, []);

  return <div>Besök idag: {visitsToday}</div>;
}
```

