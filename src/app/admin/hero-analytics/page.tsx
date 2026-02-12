"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = "grodan2025";

type HeroImpression = {
  id: number;
  created_at: string;
  session_id: string | null;
  user_agent: string | null;
  referer: string | null;
  variant: string | null;
};

type HeroClick = {
  id: number;
  created_at: string;
  session_id: string | null;
  user_agent: string | null;
  referer: string | null;
  href: string | null;
  target: string | null;
  variant: string | null;
};

export default function AdminHeroAnalytics() {
  const [impressions, setImpressions] = useState<HeroImpression[]>([]);
  const [clicks, setClicks] = useState<HeroClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
    const imp = await supabase
      .from('hero_impressions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!imp.error && imp.data) setImpressions(imp.data as HeroImpression[]);

    const clk = await supabase
      .from('hero_clicks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!clk.error && clk.data) setClicks(clk.data as HeroClick[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem('admin_authed', 'true');
      setError('');
    } else {
      setError('Fel lösenord!');
    }
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h2>Admininloggning</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Lösenord"
            style={{ width: '100%', padding: 10, fontSize: 16, marginBottom: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            autoFocus
          />
        <button type="submit" style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600 }}>
            Logga in
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>
    );
  }

  const impFiltered = impressions.filter(l =>
    // Text filter
    (!search ||
      (l.session_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.user_agent || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.referer || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.variant || '').toLowerCase().includes(search.toLowerCase())) &&
    // Date filter
    (() => {
      const t = new Date(l.created_at).getTime();
      const fromOk = !dateFrom || t >= new Date(dateFrom).getTime();
      const toOk = !dateTo || t <= new Date(dateTo).getTime() + 24*60*60*1000 - 1;
      return fromOk && toOk;
    })()
  );

  const clkFiltered = clicks.filter(l =>
    (!search ||
      (l.session_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.user_agent || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.referer || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.href || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.target || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.variant || '').toLowerCase().includes(search.toLowerCase())) &&
    (() => {
      const t = new Date(l.created_at).getTime();
      const fromOk = !dateFrom || t >= new Date(dateFrom).getTime();
      const toOk = !dateTo || t <= new Date(dateTo).getTime() + 24*60*60*1000 - 1;
      return fromOk && toOk;
    })()
  );

  const count = (arr: { variant: string | null }[], v: 'A'|'B') => arr.filter(x => x.variant === v).length;
  const aImp = count(impFiltered, 'A');
  const bImp = count(impFiltered, 'B');
  const aClk = count(clkFiltered, 'A');
  const bClk = count(clkFiltered, 'B');

  const fmtPct = (n: number) => `${n.toFixed(1)}%`;
  const aCtr = aImp ? fmtPct((aClk / aImp) * 100) : '—';
  const bCtr = bImp ? fmtPct((bClk / bImp) * 100) : '—';
  const winner: 'A'|'B'|null = aImp && bImp ? ((aClk / aImp) >= (bClk / bImp) ? 'A' : 'B') : null;

  // Variant descriptions – match current hero A/B (rubrik + knapp)
  const variantNames = {
    A: [
      'Variant A – gul CTA-knapp',
      'Rubrik: "Sluta betala för dyra elräkningar – byt nu!"',
      'Underrad: "Välj ett elavtal vi själva skulle rekommendera till familj och vänner."',
    ].join(' • '),
    B: [
      'Variant B – grön CTA-knapp',
      'Rubrik: "Trött på elräkningar som rusar?"',
      'Underrad: "Billigare el väntar – se avtal som lönar sig just nu!"',
    ].join(' • '),
  };

  function quickRange(days: number) {
    const to = new Date();
    const from = new Date(Date.now() - days*24*60*60*1000);
    setDateFrom(from.toISOString().slice(0,10));
    setDateTo(to.toISOString().slice(0,10));
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  function exportCsv(filename: string, rows: (HeroImpression | HeroClick)[]) {
    try {
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const escape = (val: unknown) => {
        const s = String(val ?? "");
        return '"' + s.replace(/"/g, '""') + '"';
      };
      const csv = [headers.join(',')]
        .concat(rows.map(r => headers.map(h => escape((r as Record<string, unknown>)[h])).join(',')))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '2rem auto',
        padding: 24,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        lineHeight: 1.6,
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Hero A/B (Admin)</h1>
      <p style={{ color: '#64748b', marginTop: 4, marginBottom: 16, fontSize: 14 }}>
        CTR = klick / visningar per variant
      </p>

      {/* Filters and Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Sök (session, agent, referer, href, variant)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <button onClick={fetchData} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Uppdatera</button>
        <button onClick={() => quickRange(1)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>24h</button>
        <button onClick={() => quickRange(7)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>7d</button>
        <button onClick={() => quickRange(30)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>30d</button>
        <button onClick={clearFilters} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Rensa</button>
        <button onClick={() => exportCsv('hero_impressions.csv', impFiltered)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Export Impressions</button>
        <button onClick={() => exportCsv('hero_clicks.csv', clkFiltered)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Export Clicks</button>
      </div>

      {/* CTR Table */}
      <div style={{ marginBottom: 24 }}>
        <h2>CTR per variant</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Variant</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Visningar</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Klick</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>CTR</th>
            </tr>
          </thead>
                     <tbody>
            <tr style={{ background: winner === 'A' ? 'rgba(0,106,167,0.08)' : undefined }}>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>A</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['A']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aImp}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aClk}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aCtr}</td>
             </tr>
            <tr style={{ background: winner === 'B' ? 'rgba(0,106,167,0.08)' : undefined }}>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>B</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['B']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{bImp}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{bClk}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{bCtr}</td>
             </tr>
           </tbody>
        </table>
      </div>

      {/* Impressions Table */}
      <h2>Visningar</h2>
      {loading && <p>Laddar...</p>}
      {!loading && impFiltered.length === 0 && <p>Inga visningar.</p>}
      {!loading && impFiltered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Variant</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Antal</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Procent</th>
            </tr>
          </thead>
                     <tbody>
             <tr>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>A</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['A']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aImp}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aImp + bImp > 0 ? `${((aImp / (aImp + bImp)) * 100).toFixed(1)}%` : '—'}</td>
             </tr>
             <tr>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>B</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['B']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{bImp}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aImp + bImp > 0 ? `${((bImp / (aImp + bImp)) * 100).toFixed(1)}%` : '—'}</td>
             </tr>
           </tbody>
        </table>
      )}

      {/* Clicks Table */}
      <h2>Klick</h2>
      {loading && <p>Laddar...</p>}
      {!loading && clkFiltered.length === 0 && <p>Inga klick.</p>}
      {!loading && clkFiltered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Variant</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Antal</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Procent</th>
            </tr>
          </thead>
                     <tbody>
             <tr>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>A</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['A']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aClk}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aClk + bClk > 0 ? `${((aClk / (aClk + bClk)) * 100).toFixed(1)}%` : '—'}</td>
             </tr>
             <tr>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                 <div><strong>B</strong></div>
                 <div style={{ fontSize: '0.8em', color: '#666' }}>{variantNames['B']}</div>
               </td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{bClk}</td>
               <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{aClk + bClk > 0 ? `${((bClk / (aClk + bClk)) * 100).toFixed(1)}%` : '—'}</td>
             </tr>
           </tbody>
        </table>
      )}
    </div>
  );
}


