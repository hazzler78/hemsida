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

interface RefererStat {
  source: string;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Färger för olika källor
const SOURCE_COLORS: Record<string, string> = {
  'Direkt/Ingen referer': '#6366f1',
  'Elchef (intern)': '#8b5cf6',
  'Google': '#4285f4',
  'Facebook': '#1877f2',
  'Twitter/X': '#000000',
  'LinkedIn': '#0077b5',
  'Instagram': '#e4405f',
  'TikTok': '#000000',
  'Bing': '#008373',
  'DuckDuckGo': '#de5833',
  'Övriga': '#6b7280',
};

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
  const [affiliateStats, setAffiliateStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    conversionRate: 0,
    conversionRateToday: 0,
    conversionRateThisWeek: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [refererStats, setRefererStats] = useState<RefererStat[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchClicks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchClicks = async (page?: number) => {
    try {
      setLoading(true);
      const currentPage = page ?? pagination.page;
      const response = await fetch(`/api/admin/robinhood-clicks?page=${currentPage}&limit=${pagination.limit}`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta klick');
      }
      const data = await response.json();
      setClicks(data.clicks || []);
      setStats(data.stats || { total: 0, today: 0, thisWeek: 0 });
      setAffiliateStats(data.affiliateStats || {
        total: 0,
        today: 0,
        thisWeek: 0,
        conversionRate: 0,
        conversionRateToday: 0,
        conversionRateThisWeek: 0,
      });
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      setRefererStats(data.refererStats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('sv-SE');
  };

  const getColorForSource = (source: string): string => {
    return SOURCE_COLORS[source] || SOURCE_COLORS['Övriga'];
  };

  const renderPieChart = () => {
    if (refererStats.length === 0) return null;

    const total = refererStats.reduce((sum, stat) => sum + stat.count, 0);
    let currentAngle = 0;
    const size = 300;
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;

    const paths = refererStats.map((stat) => {
      const percentage = (stat.count / total) * 100;
      const angle = (stat.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
      const endAngleRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      return {
        path: pathData,
        color: getColorForSource(stat.source),
        source: stat.source,
        count: stat.count,
        percentage: percentage.toFixed(1),
      };
    });

    return (
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <svg width={size} height={size} style={{ display: 'block' }}>
            {paths.map((item, index) => (
              <path
                key={index}
                d={item.path}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              />
            ))}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Klick per källa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {refererStats.map((stat, index) => {
              const percentage = ((stat.count / total) * 100).toFixed(1);
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: getColorForSource(stat.source),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{stat.source}</span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                        {stat.count} ({percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '2px',
                        marginTop: '0.25rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: getColorForSource(stat.source),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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

          {/* Conversion Statistics */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Konverteringsstatistik</h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
              Visar hur många av besökarna på robinhood-sidan som faktiskt klickar vidare på affiliate-länkar. 
              Endast affiliate-klick från användare som kom via robinhood-länken räknas med. 
              Detta ger en indikation på hur många som blir försäljning.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#166534', fontWeight: '600' }}>
                  Totalt: Affiliate-klick
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>
                  {affiliateStats.total}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                  Konverteringsgrad: {affiliateStats.conversionRate.toFixed(1)}%
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  {stats.total} besökare → {affiliateStats.total} klick
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#92400e', fontWeight: '600' }}>
                  Idag: Affiliate-klick
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
                  {affiliateStats.today}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                  Konverteringsgrad: {affiliateStats.conversionRateToday.toFixed(1)}%
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  {stats.today} besökare → {affiliateStats.today} klick
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#1e40af', fontWeight: '600' }}>
                  Denna vecka: Affiliate-klick
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {affiliateStats.thisWeek}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                  Konverteringsgrad: {affiliateStats.conversionRateThisWeek.toFixed(1)}%
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  {stats.thisWeek} besökare → {affiliateStats.thisWeek} klick
                </p>
              </div>
            </div>
          </div>

          {/* Referer Graph */}
          {refererStats.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Klick per källa</h2>
              {renderPieChart()}
            </div>
          )}

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setPagination({ ...pagination, page: 1 });
                fetchClicks(1);
              }}
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
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                <button
                  onClick={() => {
                    const newPage = Math.max(1, pagination.page - 1);
                    setPagination({ ...pagination, page: newPage });
                    fetchClicks(newPage);
                  }}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: pagination.page === 1 ? '#e5e7eb' : '#3b82f6',
                    color: pagination.page === 1 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Föregående
                </button>
                <span style={{ padding: '0 0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Sida {pagination.page} av {pagination.totalPages} ({pagination.total} totalt)
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(pagination.totalPages, pagination.page + 1);
                    setPagination({ ...pagination, page: newPage });
                    fetchClicks(newPage);
                  }}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    background: pagination.page === pagination.totalPages ? '#e5e7eb' : '#3b82f6',
                    color: pagination.page === pagination.totalPages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Nästa
                </button>
              </div>
            )}
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
