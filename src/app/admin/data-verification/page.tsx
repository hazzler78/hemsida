'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const ADMIN_PASSWORD = "grodan2025";

interface PageViewStats {
  path: string;
  count: number;
  percentage: number;
}

interface ContractClickStats {
  source: string;
  count: number;
  percentage: number;
}

interface RecentData {
  pageViews: Array<{ path: string; created_at: string; session_id: string; is_bot?: boolean; is_preview?: boolean; user_agent?: string }>;
  contractClicks: Array<{ source: string; contract_type: string; created_at: string; session_id: string }>;
}

export default function DataVerification() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageViewStats, setPageViewStats] = useState<PageViewStats[]>([]);
  const [contractClickStats, setContractClickStats] = useState<ContractClickStats[]>([]);
  const [recentData, setRecentData] = useState<RecentData>({ pageViews: [], contractClicks: [] });
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [totalContractClicks, setTotalContractClicks] = useState(0);
  const [botViews, setBotViews] = useState(0);
  const [previewViews, setPreviewViews] = useState(0);
  const [realViews, setRealViews] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );

      // Calculate date range
      const fromDate = new Date();
      if (dateRange === '24h') {
        fromDate.setHours(fromDate.getHours() - 24);
      } else {
        const days = dateRange === '7d' ? 7 : 30;
        fromDate.setDate(fromDate.getDate() - days);
      }
      const fromISO = fromDate.toISOString();

      // 1. Get page views by path
      const { data: pageViewsData, error: pvError } = await supabase
        .from('page_views')
        .select('path, created_at, session_id, is_bot, is_preview, user_agent')
        .gte('created_at', fromISO)
        .order('created_at', { ascending: false });

      if (pvError) {
        console.error('Page views error:', pvError);
        throw new Error(`Page views: ${pvError.message}`);
      }

      // Group by path
      const pathMap = new Map<string, number>();
      pageViewsData?.forEach(pv => {
        const path = pv.path || '(ingen path)';
        pathMap.set(path, (pathMap.get(path) || 0) + 1);
      });

      const totalPV = pageViewsData?.length || 0;
      setTotalPageViews(totalPV);

      // Räkna botar och preview-deployments
      const bots = pageViewsData?.filter(pv => pv.is_bot === true).length || 0;
      const previews = pageViewsData?.filter(pv => pv.is_preview === true).length || 0;
      const real = totalPV - bots - previews;
      setBotViews(bots);
      setPreviewViews(previews);
      setRealViews(real);

      const pvStats: PageViewStats[] = Array.from(pathMap.entries())
        .map(([path, count]) => ({
          path,
          count,
          percentage: totalPV > 0 ? (count / totalPV * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      setPageViewStats(pvStats);

      // 2. Get contract clicks by source
      const { data: contractClicksData, error: ccError } = await supabase
        .from('contract_clicks')
        .select('source, contract_type, created_at, session_id')
        .gte('created_at', fromISO)
        .order('created_at', { ascending: false });

      if (ccError) {
        console.error('Contract clicks error:', ccError);
        throw new Error(`Contract clicks: ${ccError.message}`);
      }

      // Group by source
      const sourceMap = new Map<string, number>();
      contractClicksData?.forEach(cc => {
        const source = cc.source || '(ingen source)';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const totalCC = contractClicksData?.length || 0;
      setTotalContractClicks(totalCC);

      const ccStats: ContractClickStats[] = Array.from(sourceMap.entries())
        .map(([source, count]) => ({
          source,
          count,
          percentage: totalCC > 0 ? (count / totalCC * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      setContractClickStats(ccStats);

      // 3. Get recent data samples
      setRecentData({
        pageViews: (pageViewsData || []).slice(0, 20),
        contractClicks: (contractClicksData || []).slice(0, 20)
      });

    } catch (e) {
      setError('Kunde inte hämta data: ' + (e instanceof Error ? e.message : 'Okänt fel'));
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate conversion rates
  const jamforPageViews = pageViewStats.find(p => p.path === '/jamfor-elpriser')?.count || 0;
  const fakturaPageViews = pageViewStats.find(p => p.path === '/fakturaanalys')?.count || 0;
  const jamforClicks = contractClickStats.find(c => c.source === 'jamfor-elpriser')?.count || 0;
  const fakturaClicks = contractClickStats.find(c => c.source === 'fakturaanalys')?.count || 0;
  
  const jamforConversion = jamforPageViews > 0 ? (jamforClicks / jamforPageViews * 100) : 0;
  const fakturaConversion = fakturaPageViews > 0 ? (fakturaClicks / fakturaPageViews * 100) : 0;

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '2rem auto', 
      padding: 24,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#1f2937' }}>
            🔍 Dataverifiering
          </h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Verifiera att tracking-data stämmer
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as '24h' | '7d' | '30d')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 8, 
              border: '1px solid #cbd5e1',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            <option value="24h">Senaste 24 timmarna</option>
            <option value="7d">Senaste 7 dagarna</option>
            <option value="30d">Senaste 30 dagarna</option>
          </select>
          <Link href="/admin/dashboard" style={{ 
            padding: '8px 16px', 
            borderRadius: 8, 
            border: '1px solid #cbd5e1',
            textDecoration: 'none',
            color: '#374151',
            fontSize: 14,
            fontWeight: 500
          }}>
            ← Tillbaka till Dashboard
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Laddar data...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: 16, 
          borderRadius: 8,
          marginBottom: 24
        }}>
          <strong>Fel:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            <div style={{ 
              background: 'white',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 8 }}>Totalt Page Views</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {totalPageViews.toLocaleString('sv-SE')}
              </div>
            </div>
            <div style={{ 
              background: '#f0fdf4',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #86efac',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: 8 }}>Riktiga Besök</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {realViews.toLocaleString('sv-SE')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: 4 }}>
                {totalPageViews > 0 ? ((realViews / totalPageViews) * 100).toFixed(1) : 0}% av totalt
              </div>
            </div>
            <div style={{ 
              background: '#fef2f2',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #fecaca',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: 8 }}>Botar</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {botViews.toLocaleString('sv-SE')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: 4 }}>
                {totalPageViews > 0 ? ((botViews / totalPageViews) * 100).toFixed(1) : 0}% av totalt
              </div>
            </div>
            <div style={{ 
              background: '#fffbeb',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #fde68a',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: 8 }}>Preview/Test</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {previewViews.toLocaleString('sv-SE')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 4 }}>
                {totalPageViews > 0 ? ((previewViews / totalPageViews) * 100).toFixed(1) : 0}% av totalt
              </div>
            </div>
            <div style={{ 
              background: 'white',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 8 }}>Kontraktsklick</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {totalContractClicks.toLocaleString('sv-SE')}
              </div>
            </div>
            <div style={{ 
              background: 'white',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 8 }}>Konverteringsgrad</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: realViews > 0 && totalContractClicks / realViews < 0.01 ? '#ef4444' : '#10b981' }}>
                {realViews > 0 ? ((totalContractClicks / realViews) * 100).toFixed(2) : 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                (av riktiga besök)
              </div>
            </div>
          </div>

          {/* Conversion Analysis */}
          <div style={{ 
            background: 'white',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Konverteringsanalys</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ 
                padding: 16,
                background: '#f0f9ff',
                borderRadius: 8,
                border: '1px solid #bae6fd'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: 4 }}>/jamfor-elpriser</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e', marginBottom: 8 }}>
                  {jamforConversion.toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                  {jamforClicks} klick av {jamforPageViews} besök
                </div>
              </div>
              <div style={{ 
                padding: 16,
                background: '#faf5ff',
                borderRadius: 8,
                border: '1px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#7c3aed', marginBottom: 4 }}>/fakturaanalys</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6d28d9', marginBottom: 8 }}>
                  {fakturaConversion.toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7c3aed' }}>
                  {fakturaClicks} klick av {fakturaPageViews} besök
                </div>
              </div>
            </div>
          </div>

          {/* Page Views by Path */}
          <div style={{ 
            background: 'white',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Page Views per Sida</h2>
            {pageViewStats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pageViewStats.map((stat, index) => (
                  <div key={index} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: 8
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                        {stat.path}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {stat.count.toLocaleString('sv-SE')} besök ({stat.percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div style={{ 
                      width: 200,
                      height: 8,
                      background: '#e5e7eb',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${stat.percentage}%`,
                        height: '100%',
                        background: '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', margin: '2rem 0' }}>
                Ingen data tillgänglig
              </p>
            )}
          </div>

          {/* Contract Clicks by Source */}
          <div style={{ 
            background: 'white',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Kontraktsklick per Källa</h2>
            {contractClickStats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {contractClickStats.map((stat, index) => (
                  <div key={index} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: 8
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                        {stat.source}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {stat.count.toLocaleString('sv-SE')} klick ({stat.percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div style={{ 
                      width: 200,
                      height: 8,
                      background: '#e5e7eb',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${stat.percentage}%`,
                        height: '100%',
                        background: '#10b981',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', margin: '2rem 0' }}>
                Ingen data tillgänglig
              </p>
            )}
          </div>

          {/* Recent Data Samples */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: 24,
            marginBottom: 24
          }}>
            {/* Recent Page Views */}
            <div style={{ 
              background: 'white',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Senaste Page Views (20 st)</h2>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {recentData.pageViews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recentData.pageViews.map((pv, index) => (
                      <div key={index} style={{ 
                        padding: 12,
                        background: pv.is_bot ? '#fef2f2' : pv.is_preview ? '#fffbeb' : '#f9fafb',
                        borderRadius: 6,
                        fontSize: '0.875rem',
                        border: pv.is_bot ? '1px solid #fecaca' : pv.is_preview ? '1px solid #fde68a' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {pv.path || '(ingen path)'}
                          </div>
                          {pv.is_bot && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>BOT</span>}
                          {pv.is_preview && <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>PREVIEW</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 2 }}>
                          {new Date(pv.created_at).toLocaleString('sv-SE')} • Session: {pv.session_id?.substring(0, 8) || 'N/A'}
                        </div>
                        {pv.user_agent && (
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>
                            {pv.user_agent.length > 60 ? pv.user_agent.substring(0, 60) + '...' : pv.user_agent}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: '2rem 0' }}>
                    Ingen data tillgänglig
                  </p>
                )}
              </div>
            </div>

            {/* Recent Contract Clicks */}
            <div style={{ 
              background: 'white',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Senaste Kontraktsklick (20 st)</h2>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {recentData.contractClicks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recentData.contractClicks.map((cc, index) => (
                      <div key={index} style={{ 
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 6,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                          {cc.source || '(ingen source)'} • {cc.contract_type || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {new Date(cc.created_at).toLocaleString('sv-SE')} • Session: {cc.session_id?.substring(0, 8) || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: '2rem 0' }}>
                    Ingen data tillgänglig
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Analysis & Recommendations */}
          <div style={{ 
            background: '#fffbeb',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #fbbf24',
            marginBottom: 24
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#92400e' }}>Analys & Rekommendationer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <strong style={{ color: '#78350f' }}>Om konverteringsgraden är låg (&lt;1%):</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#78350f' }}>
                  <li>Kontrollera att kontraktsknappar faktiskt syns på sidorna</li>
                  <li>Verifiera att tracking-koden körs när användare klickar</li>
                  <li>Kontrollera browser console för felmeddelanden</li>
                  <li>Testa själv genom att klicka på knapparna och se om data registreras</li>
                </ul>
              </div>
              <div>
                <strong style={{ color: '#78350f' }}>Om page views är mycket högre än kontraktsklick:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#78350f' }}>
                  <li>Detta är normalt om många besökare är på startsidan (som inte har kontraktsknappar)</li>
                  <li>Kontrollera fördelningen av page views per sida ovan</li>
                  <li>Om /jamfor-elpriser eller /fakturaanalys har många besök men få klick, kan det vara ett UX-problem</li>
                </ul>
              </div>
              <div>
                <strong style={{ color: '#78350f' }}>För att testa tracking:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#78350f' }}>
                  <li>Öppna /jamfor-elpriser eller /fakturaanalys</li>
                  <li>Klicka på en kontraktsknapp</li>
                  <li>Uppdatera denna sida och kontrollera att klicket registrerades</li>
                  <li>Kontrollera browser console (F12) för eventuella fel</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

