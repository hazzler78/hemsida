'use client';

import { useCallback, useEffect, useState } from 'react';
import { ADMIN_PASSWORD } from '@/lib/adminAuth';
import {
  CONVERSION_EXPERIMENT,
  formatRate,
  deltaLabel,
  type ConversionMetrics,
  type ConversionSnapshotRow,
} from '@/lib/conversionExperiment';

type ApiResponse = {
  ok?: boolean;
  error?: string;
  hint?: string;
  experiment?: typeof CONVERSION_EXPERIMENT;
  windowDays?: number;
  current?: ConversionMetrics;
  baseline?: ConversionSnapshotRow | null;
  liveStart?: ConversionSnapshotRow | null;
  after?: ConversionMetrics | null;
  snapshots?: ConversionSnapshotRow[];
  tableExistsHint?: string;
  metrics?: ConversionMetrics;
  row?: ConversionSnapshotRow;
  snapshot?: ConversionSnapshotRow;
};

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

function MetricsGrid({ title, metrics }: { title: string; metrics: ConversionMetrics }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#334155' }}>{title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>
        {new Date(metrics.from).toLocaleString('sv-SE')} → {new Date(metrics.to).toLocaleString('sv-SE')} (
        {metrics.windowDays} dagar)
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        <MetricCard label="Startsidavisningar" value={metrics.homepageViews.toLocaleString('sv-SE')} />
        <MetricCard label="Hero-klick" value={metrics.heroClicks.toLocaleString('sv-SE')} />
        <MetricCard
          label="Avtalssida"
          value={metrics.contractPageViews.toLocaleString('sv-SE')}
          sub="v1 + v2"
        />
        <MetricCard
          label="Affiliate-klick"
          value={metrics.affiliateClicks.toLocaleString('sv-SE')}
          sub={`varav v2: ${metrics.affiliateClicksV2}`}
        />
        <MetricCard
          label="Avtal → affiliate"
          value={formatRate(metrics.contractToAffiliateRate)}
          sub="Nyckeltal"
        />
        <MetricCard label="Startsida → affiliate" value={formatRate(metrics.homepageToAffiliateRate)} />
      </div>
    </div>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ConversionExperimentPanel() {
  const [days, setDays] = useState<7 | 14>(14);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/conversion-experiment?days=${days}`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(json.error || 'Kunde inte hämta mätning');
        setHint(json.hint || json.tableExistsHint || '');
        setData(null);
        return;
      }
      setData(json);
      setHint(json.tableExistsHint || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const postAction = async (action: 'save_baseline' | 'mark_live' | 'save_checkpoint') => {
    try {
      setBusy(true);
      setMessage('');
      setError('');
      const res = await fetch('/api/admin/conversion-experiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD,
        },
        body: JSON.stringify({ action, days }),
      });
      const json = (await res.json()) as ApiResponse;

      // Alltid ladda ner JSON-kopia så ni har backup även om DB-insert misslyckas
      if (json.metrics || json.snapshot) {
        downloadJson(
          `${CONVERSION_EXPERIMENT.id}-${action}-${days}d-${new Date().toISOString().slice(0, 10)}.json`,
          {
            experiment: CONVERSION_EXPERIMENT,
            action,
            savedAt: new Date().toISOString(),
            snapshot: json.snapshot || json.row || null,
            metrics: json.metrics || json.snapshot?.metrics,
          }
        );
      }

      if (!res.ok) {
        setError(json.error || 'Kunde inte spara');
        setHint(json.hint || '');
        setMessage(
          json.metrics
            ? 'Siffrorna laddades ner som JSON-fil (backup). Kör SQL-schemat och spara igen för DB.'
            : ''
        );
        return;
      }

      setMessage(
        action === 'save_baseline'
          ? 'Baseline sparad (+ JSON-backup nedladdad).'
          : action === 'mark_live'
            ? 'Live-start markerad. Efter-mätning börjar räknas från nu.'
            : 'Checkpoint sparad.'
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nätverksfel');
    } finally {
      setBusy(false);
    }
  };

  const baselineMetrics = data?.baseline?.metrics;
  const afterMetrics = data?.after;
  const current = data?.current;

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#111827' }}>
            Mätning: ökar konverteringen?
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', maxWidth: 560, lineHeight: 1.5 }}>
            Experiment: <strong>{CONVERSION_EXPERIMENT.name}</strong>. Spara baseline nu, markera när
            ändringen är live, jämför sedan samma antal dagar före/efter.
          </p>
        </div>
        <label style={{ fontSize: 13, color: '#475569' }}>
          Fönster{' '}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) === 7 ? 7 : 14)}
            style={{ marginLeft: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          >
            <option value={7}>7 dagar</option>
            <option value={14}>14 dagar</option>
          </select>
        </label>
      </div>

      <ul style={{ margin: '0 0 16px', paddingLeft: 18, color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>
        {CONVERSION_EXPERIMENT.changes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => postAction('save_baseline')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#0f172a',
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          1. Spara baseline nu
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => postAction('mark_live')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#16a34a',
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          2. Markera ändringen live
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => postAction('save_checkpoint')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#0f172a',
            fontWeight: 600,
            fontSize: 13,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          Spara checkpoint
        </button>
        <button
          type="button"
          disabled={loading || busy}
          onClick={load}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#475569',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Uppdatera
        </button>
      </div>

      {message ? (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 8,
            color: '#065f46',
            fontSize: 13,
          }}
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#991b1b',
            fontSize: 13,
          }}
        >
          {error}
          {hint ? <div style={{ marginTop: 6, color: '#b45309' }}>{hint}</div> : null}
        </div>
      ) : null}

      {loading && !data ? (
        <p style={{ color: '#64748b' }}>Hämtar siffror…</p>
      ) : (
        <>
          {current ? <MetricsGrid title="Just nu (rullande fönster)" metrics={current} /> : null}

          {baselineMetrics ? (
            <MetricsGrid title="Sparad baseline" metrics={baselineMetrics} />
          ) : (
            <p style={{ fontSize: 13, color: '#b45309', marginBottom: 16 }}>
              Ingen baseline sparad ännu — klicka &quot;Spara baseline nu&quot; innan eller precis när ni
              deployar.
            </p>
          )}

          {data?.liveStart?.created_at ? (
            <p style={{ fontSize: 13, color: '#166534', marginBottom: 12 }}>
              Live sedan {new Date(data.liveStart.created_at).toLocaleString('sv-SE')}. Jämför
              nyckeltalet <strong>Avtal → affiliate</strong> mot baseline.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              När PR:n är ute i produktion: klicka &quot;Markera ändringen live&quot;.
            </p>
          )}

          {baselineMetrics && afterMetrics ? (
            <div
              style={{
                padding: 16,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#0c4a6e' }}>
                Före vs efter (samma fönster)
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 10,
                }}
              >
                <MetricCard
                  label="Avtal → affiliate"
                  value={`${formatRate(baselineMetrics.contractToAffiliateRate)} → ${formatRate(afterMetrics.contractToAffiliateRate)}`}
                  sub={deltaLabel(
                    baselineMetrics.contractToAffiliateRate,
                    afterMetrics.contractToAffiliateRate
                  )}
                />
                <MetricCard
                  label="Startsida → affiliate"
                  value={`${formatRate(baselineMetrics.homepageToAffiliateRate)} → ${formatRate(afterMetrics.homepageToAffiliateRate)}`}
                  sub={deltaLabel(
                    baselineMetrics.homepageToAffiliateRate,
                    afterMetrics.homepageToAffiliateRate
                  )}
                />
                <MetricCard
                  label="Affiliate-klick"
                  value={`${baselineMetrics.affiliateClicks} → ${afterMetrics.affiliateClicks}`}
                />
              </div>
              <MetricsGrid title="Efter live-start" metrics={afterMetrics} />
            </div>
          ) : null}

          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            Tips: jämför också Salesys-signups samma period. Varje sparning laddar ner en JSON-backup.
            SQL: <code>supabase-conversion-experiments.sql</code>
          </p>
        </>
      )}
    </section>
  );
}
