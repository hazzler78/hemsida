"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = "grodan2025";

type BannerClick = {
  id: number;
  created_at: string;
  session_id: string | null;
  user_agent: string | null;
  referer: string | null;
  href: string | null;
  variant: string | null;
};

type BannerImpression = {
  id: number;
  created_at: string;
  session_id: string | null;
  user_agent: string | null;
  referer: string | null;
  variant: string | null;
};

export default function AdminBannerClicks() {
  const [logs, setLogs] = useState<BannerClick[]>([]);
  const [impressions, setImpressions] = useState<BannerImpression[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('banner_ab_test_from') || '') : ''
  );
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  const getSupabase = () =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('banner_clicks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLogs(data as BannerClick[]);
    const imp = await supabase
      .from('banner_impressions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!imp.error && imp.data) setImpressions(imp.data as BannerImpression[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: 24, background: '#ffffff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ color: 'var(--foreground)' }}>Admininloggning</h2>
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

  const withinDate = (iso: string) => {
    if (!dateFrom && !dateTo) return true;
    const ts = new Date(iso).getTime();
    if (dateFrom) {
      const start = new Date(dateFrom + 'T00:00:00').getTime();
      if (ts < start) return false;
    }
    if (dateTo) {
      const end = new Date(dateTo + 'T23:59:59').getTime();
      if (ts > end) return false;
    }
    return true;
  };

  const filtered = logs
    .filter(l => withinDate(l.created_at))
    .filter(l =>
      !search ||
      (l.session_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.user_agent || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.href || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.variant || '').toLowerCase().includes(search.toLowerCase())
    );

  const filteredImpressions = impressions.filter(i => withinDate(i.created_at));

  // A/B nudge: A = AI (bara en faktura, 30 sek), B = Solceller (nyfiken, ingen förpliktelse)
  const variantNames: Record<string, string> = {
    'A': 'AI – Bara en faktura, se möjliga besparing på 30 sek (länk till fakturaanalys).',
    'B': 'Solceller – Nyfiken? Få offert, ingen förpliktelse (scroll till formulär).'
  };

  // Beräkna vinnare (högst CTR vinner; vid lika vinner den med flest klick)
  const aClicks = filtered.filter(l => l.variant === 'A').length;
  const aImps = filteredImpressions.filter(i => i.variant === 'A').length;
  const bClicks = filtered.filter(l => l.variant === 'B').length;
  const bImps = filteredImpressions.filter(i => i.variant === 'B').length;
  const aCtr = aImps > 0 ? aClicks / aImps : 0;
  const bCtr = bImps > 0 ? bClicks / bImps : 0;
  const winner: 'A' | 'B' | null =
    aImps > 0 || bImps > 0
      ? aCtr > bCtr
        ? 'A'
        : bCtr > aCtr
          ? 'B'
          : aClicks >= bClicks
            ? 'A'
            : 'B'
      : null;
  const winnerCtr = winner === 'A' ? aCtr : winner === 'B' ? bCtr : 0;
  const winnerClicks = winner === 'A' ? aClicks : winner === 'B' ? bClicks : 0;
  const winnerImps = winner === 'A' ? aImps : winner === 'B' ? bImps : 0;

  const tableCell = { padding: '10px 12px', border: '1px solid var(--gray-200)', fontSize: '0.9rem' };
  const tableHeader = { ...tableCell, background: 'var(--gray-100)', fontWeight: 600 };

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--gray-200)',
      }}>
      <h1 style={{ marginBottom: 4, color: 'var(--foreground)' }}>Bannerklick (Admin)</h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: 8, fontSize: '0.95rem' }}>
        CTR = klick ÷ visningar per variant. Vinnare = variant med högst CTR.
      </p>
      <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: '0.85rem' }}>
        Data raderas aldrig – filtren styr bara vad som visas. Använd &quot;Start nytt A/B-test&quot; för att se enbart ny statistik.
      </p>

      {/* Filter och sök */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--gray-600)' }}>Från</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 8, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }} />
          <label style={{ fontSize: 12, color: 'var(--gray-600)' }}>Till</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 8, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <input
          placeholder="Sök (session, agent, href, variant)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 240, padding: 8, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
        />
        <button onClick={fetchLogs} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-300)', background: 'var(--gray-50)', fontWeight: 500 }}>Uppdatera</button>
        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setDateFrom(today);
            setDateTo('');
            setSearch('');
            if (typeof window !== 'undefined') localStorage.setItem('banner_ab_test_from', today);
          }}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', background: 'rgba(0,106,167,0.08)', fontWeight: 600, color: 'var(--primary)' }}
          title="Visa endast statistik från idag – sparas tills du klickar Visa all data"
        >
          Start nytt A/B-test
        </button>
        <button
          type="button"
          onClick={() => {
            setDateFrom('');
            setDateTo('');
            setSearch('');
            if (typeof window !== 'undefined') localStorage.removeItem('banner_ab_test_from');
          }}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-300)', background: '#fff', fontWeight: 500, color: 'var(--gray-700)' }}
          title="Visa all data"
        >
          Visa all data
        </button>
      </div>

      {loading && <p style={{ color: 'var(--gray-600)' }}>Laddar...</p>}
      {!loading && filtered.length === 0 && <p style={{ color: 'var(--gray-600)' }}>Inga klickloggar.</p>}

      {/* Vinnare – tydlig sektion överst */}
      {!loading && (aImps > 0 || bImps > 0) && (
        <section
          style={{
            marginBottom: 28,
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            background: winner ? 'linear-gradient(135deg, rgba(0,106,167,0.08) 0%, rgba(254,204,0,0.06) 100%)' : 'var(--gray-50)',
            border: winner ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h2 style={{ marginBottom: 8, fontSize: '1.1rem', color: 'var(--gray-700)' }}>Vinnare (mest klick per visning)</h2>
          {winner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.75rem' }} aria-hidden>🏆</span>
              <div>
                <strong style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>Variant {winner}</strong>
                <div style={{ color: 'var(--gray-600)', marginTop: 4 }}>
                  CTR {(winnerCtr * 100).toFixed(1)}% · {winnerClicks} klick av {winnerImps} visningar
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 4 }}>{variantNames[winner]}</div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--gray-600)' }}>Ingen tydlig vinnare (för lite data).</p>
          )}
        </section>
      )}

      {/* CTR per variant – kort med vinnar-markering */}
      {!loading && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.15rem' }}>CTR per variant</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {(['A', 'B'] as const).map(v => {
              const vClicks = filtered.filter(l => l.variant === v).length;
              const vImps = filteredImpressions.filter(i => i.variant === v).length;
              const ctrNum = vImps > 0 ? (vClicks / vImps) : 0;
              const isWinner = winner === v;
              return (
                <div
                  key={v}
                  style={{
                    border: isWinner ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    background: isWinner ? 'rgba(0,106,167,0.06)' : 'var(--gray-50)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Variant {v}</span>
                    {isWinner && <span style={{ fontSize: 11, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>Vinnare</span>}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{vImps > 0 ? (ctrNum * 100).toFixed(1) + '%' : '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>{vClicks} klick · {vImps} visningar</div>
                </div>
              );
            })}
            {/* Lift */}
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--gray-50)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Relativ skillnad</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {aImps > 0 && bImps > 0
                  ? (() => {
                      const lift = aCtr ? ((bCtr - aCtr) / aCtr) * 100 : 0;
                      return `${lift >= 0 ? '+' : ''}${lift.toFixed(1)}% B vs A`;
                    })()
                  : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>B jämfört med A</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr>
                <th style={tableHeader}>Variant</th>
                <th style={tableHeader}>Visningar</th>
                <th style={tableHeader}>Klick</th>
                <th style={tableHeader}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B'] as const).map(v => {
                const vClicks = filtered.filter(l => l.variant === v).length;
                const vImps = filteredImpressions.filter(i => i.variant === v).length;
                const ctr = vImps > 0 ? `${((vClicks / vImps) * 100).toFixed(1)}%` : '—';
                const isWinner = winner === v;
                return (
                  <tr key={v} style={isWinner ? { background: 'rgba(0,106,167,0.06)' } : undefined}>
                    <td style={tableCell}>
                      <div style={{ fontWeight: 600 }}>Variant {v}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 2 }}>{variantNames[v]}</div>
                    </td>
                    <td style={tableCell}>{vImps}</td>
                    <td style={tableCell}>{vClicks}</td>
                    <td style={tableCell}>{ctr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Raw klick-lista */}
      {!loading && filtered.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ marginBottom: 12, fontSize: '1.15rem' }}>Senaste klick (rad för rad)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeader}>Datum</th>
                  <th style={tableHeader}>Variant</th>
                  <th style={tableHeader}>Session</th>
                  <th style={tableHeader}>Href</th>
                  <th style={tableHeader}>Referer</th>
                  <th style={tableHeader}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td style={tableCell}>{new Date(l.created_at).toLocaleString()}</td>
                    <td style={tableCell}>{l.variant}</td>
                    <td style={tableCell}>{l.session_id}</td>
                    <td style={{ ...tableCell, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.href || ''}>{l.href}</td>
                    <td style={{ ...tableCell, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.referer || ''}>{l.referer}</td>
                    <td style={tableCell}>{l.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Nedbrytning: Referer-domän */}
      {!loading && filtered.length > 0 && (() => {
        const domainOf = (url?: string | null) => {
          if (!url) return '(okänd)';
          try {
            const u = new URL(url);
            return u.hostname.replace(/^www\./, '');
          } catch {
            return '(okänd)';
          }
        };
        const rows = filtered.reduce<Record<string, { clicks: number; a: number; b: number }>>((acc, l) => {
          const d = domainOf(l.referer);
          if (!acc[d]) acc[d] = { clicks: 0, a: 0, b: 0 };
          acc[d].clicks += 1;
          if (l.variant === 'A') acc[d].a += 1;
          if (l.variant === 'B') acc[d].b += 1;
          return acc;
        }, {});
        const impRows = filteredImpressions.reduce<Record<string, { imps: number; a: number; b: number }>>((acc, i) => {
          const d = domainOf(i.referer);
          if (!acc[d]) acc[d] = { imps: 0, a: 0, b: 0 };
          acc[d].imps += 1;
          if (i.variant === 'A') acc[d].a += 1;
          if (i.variant === 'B') acc[d].b += 1;
          return acc;
        }, {});
        const entries = Object.entries(rows).map(([domain, c]) => {
          const imp: { imps: number; a: number; b: number } = impRows[domain] || { imps: 0, a: 0, b: 0 };
          const ctr = imp.imps > 0 ? (c.clicks / imp.imps) : 0;
          return { domain, clicks: c.clicks, impressions: imp.imps, ctr };
        }).sort((a, b) => b.clicks - a.clicks).slice(0, 12);
        return (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12, fontSize: '1.15rem' }}>Nedbrytning per källa (referer-domän)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeader}>Domän</th>
                    <th style={tableHeader}>Visningar</th>
                    <th style={tableHeader}>Klick</th>
                    <th style={tableHeader}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(r => (
                    <tr key={r.domain}>
                      <td style={tableCell}>{r.domain}</td>
                      <td style={tableCell}>{r.impressions}</td>
                      <td style={tableCell}>{r.clicks}</td>
                      <td style={tableCell}>{r.impressions > 0 ? ((r.ctr * 100).toFixed(1) + '%') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}

      {/* Nedbrytning: Destination (href) */}
      {!loading && filtered.length > 0 && (() => {
        const byHref = filtered.reduce<Record<string, { clicks: number }>>((acc, l) => {
          const key = l.href || '(okänd)';
          if (!acc[key]) acc[key] = { clicks: 0 };
          acc[key].clicks += 1;
          return acc;
        }, {});
        const impByHref = filteredImpressions.reduce<Record<string, number>>((acc) => {
          const key = '(banner)';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const rows = Object.entries(byHref).map(([href, v]) => ({
          href,
          clicks: v.clicks,
          impressions: impByHref['(banner)'] || 0,
          ctr: (impByHref['(banner)'] || 0) > 0 ? v.clicks / (impByHref['(banner)'] || 1) : 0
        })).sort((a, b) => b.clicks - a.clicks).slice(0, 12);
        return (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12, fontSize: '1.15rem' }}>Nedbrytning per destination (href)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeader}>Href</th>
                    <th style={tableHeader}>Klick</th>
                    <th style={tableHeader}>CTR (global)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.href}>
                      <td style={{ ...tableCell, maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.href}>{r.href}</td>
                      <td style={tableCell}>{r.clicks}</td>
                      <td style={tableCell}>{(r.ctr * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}
      </div>
    </div>
  );
}


