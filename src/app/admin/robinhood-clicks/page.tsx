'use client';

import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = "grodan2025";

interface RobinhoodClick {
  id: number;
  user_agent: string | null;
  referer: string | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: number;
}

export default function RobinhoodClicksPage() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [clicks, setClicks] = useState<RobinhoodClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchClicks();
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem('admin_authed', 'true');
      setError(null);
    } else {
      setError('Fel lösenord!');
    }
  }

  const fetchClicks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/robinhood-clicks');
      if (!response.ok) {
        throw new Error('Kunde inte hämta klick');
      }
      const data = await response.json();
      setClicks(data.clicks || []);
      setStats(data.stats || { total: 0, today: 0, thisWeek: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('sv-SE');
  };

  if (!authed) {
    return (
      <div style={{ 
        maxWidth: 400, 
        margin: '4rem auto', 
        padding: 24, 
        border: '1px solid #e5e7eb', 
        borderRadius: 12,
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginBottom: 16, textAlign: 'center' }}>Admininloggning</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Lösenord"
            style={{ 
              width: '100%', 
              padding: 12, 
              fontSize: 16, 
              marginBottom: 12, 
              borderRadius: 8, 
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: 12, 
              fontSize: 16, 
              borderRadius: 8, 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Logga in
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Robinhood Klick-statistik</h1>

      {loading && <p>Laddar...</p>}
      {error && <p style={{ color: 'red' }}>Fel: {error}</p>}

      {!loading && !error && (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Totalt antal klick
              </h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.total}
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Klick idag
              </h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.today}
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Klick denna vecka
              </h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.thisWeek}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={fetchClicks}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Uppdatera
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Datum</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>IP-adress</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Referer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {clicks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                      Inga klick hittades
                    </td>
                  </tr>
                ) : (
                  clicks.map((click) => (
                    <tr key={click.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{click.id}</td>
                      <td style={{ padding: '0.75rem' }}>{formatDate(click.created_at)}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {click.ip_address || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {click.referer || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {click.user_agent || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
