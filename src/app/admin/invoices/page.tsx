"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';


type InvoiceLog = {
  id: number;
  created_at: string;
  session_id: string | null;
  user_agent: string | null;
  file_mime: string | null;
  file_size: number | null;
  image_sha256: string | null;
  model: string | null;
  system_prompt_version: string | null;
  gpt_answer: string | null;
  is_correct: boolean | null;
  correction_notes: string | null;
  corrected_total_extra: number | null;
  corrected_savings: number | null;
  consent?: boolean | null;
};

export default function AdminInvoices() {
  const [logs, setLogs] = useState<InvoiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  // no-op state removed to satisfy eslint
  const [search, setSearch] = useState("");

  // Create Supabase client lazily at runtime to avoid build-time URL parsing
  const getSupabase = () =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('invoice_ocr')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLogs(data as InvoiceLog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setCorrect(id: number, isCorrect: boolean) {
    try {
      const res = await fetch('/api/invoice-ocr/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: id, isCorrect })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || 'Kunde inte spara status');
      } else {
        await fetchLogs();
      }
    } catch {
      alert('Kunde inte spara status');
    }
  }

  async function editNotes(id: number) {
    const current = logs.find(l => l.id === id)?.correction_notes || '';
    const input = window.prompt('Korrigeringsanteckning:', current || '');
    if (input === null) return;
    try {
      const res = await fetch('/api/invoice-ocr/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: id, correctionNotes: input })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || 'Kunde inte spara anteckning');
      } else {
        await fetchLogs();
      }
    } catch {
      alert('Kunde inte spara anteckning');
    }
  }



  const filtered = logs.filter(l =>
    !search ||
    (l.session_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.user_agent || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.gpt_answer || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <h1>Fakturaanalyser (Admin)</h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Sök (session, agent eller text)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button onClick={fetchLogs} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Uppdatera</button>
      </div>
      {loading && <p>Laddar...</p>}
      {!loading && filtered.length === 0 && <p>Inga loggar.</p>}

      {!loading && filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Datum</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Session</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Fil</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Agent</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Korrekt?</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Anteckning</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Åtgärder</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Bild</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <>
                <tr key={log.id}>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 12, maxWidth: 200, wordBreak: 'break-all' }} title={log.session_id || ''}>{log.session_id}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 12, maxWidth: 150 }} title={`${log.file_mime} ${typeof log.file_size === 'number' ? `• ${(log.file_size/1024).toFixed(0)} KB` : ''}`}>
                    {log.file_mime} {typeof log.file_size === 'number' ? `• ${(log.file_size/1024).toFixed(0)} KB` : ''}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 12, maxWidth: 300, wordBreak: 'break-all' }} title={log.user_agent || ''}>{log.user_agent}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                    {log.is_correct === true && '✅'}
                    {log.is_correct === false && '❌'}
                    {log.is_correct === null && '—'}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb', maxWidth: 300, wordBreak: 'break-word' }} title={log.correction_notes || ''}>
                    {log.correction_notes || ''}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setCorrect(log.id, true)} style={{ padding: '4px 8px' }}>Markera ✅</button>
                      <button onClick={() => setCorrect(log.id, false)} style={{ padding: '4px 8px' }}>Markera ❌</button>
                      <button onClick={() => editNotes(log.id)} style={{ padding: '4px 8px' }}>Anteckning</button>
                      <button onClick={() => setExpanded(expanded === log.id ? null : log.id)} style={{ padding: '4px 8px' }}>{expanded === log.id ? 'Dölj' : 'Visa'}</button>
                    </div>
                  </td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                    {log.consent ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/invoice-ocr/file-url?invoiceId=${log.id}`);
                            const data = await res.json();
                            if (res.ok && data?.url) {
                              console.log('Raw URL from API:', data.url);
                              
                              // Create absolute URL more safely
                              let imageUrl;
                              if (data.url.startsWith('http')) {
                                imageUrl = data.url;
                              } else {
                                // Use current page's origin
                                const origin = window.location.protocol + '//' + window.location.host;
                                imageUrl = origin + data.url;
                              }
                              
                              console.log('Final image URL:', imageUrl);
                              
                              // Validate URL before using it
                              try {
                                new URL(imageUrl);
                                
                                // Try window.open first, fallback to creating img element
                                const newWindow = window.open(imageUrl, '_blank');
                                if (!newWindow) {
                                  // If popup was blocked, create img element instead
                                  const img = document.createElement('img');
                                  img.src = imageUrl;
                                  img.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:90vw;max-height:90vh;z-index:9999;background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
                                  
                                  const overlay = document.createElement('div');
                                  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;';
                                  overlay.onclick = () => {
                                    document.body.removeChild(overlay);
                                    document.body.removeChild(img);
                                  };
                                  
                                  document.body.appendChild(overlay);
                                  document.body.appendChild(img);
                                }
                              } catch (urlError) {
                                console.error('Invalid URL created:', imageUrl, urlError);
                                alert(`Ogiltig URL skapad: ${imageUrl}\nFel: ${urlError}`);
                              }
                            } else {
                              const errorMsg = data?.error || 'Okänt fel';
                              const details = data?.details || '';
                              const hint = data?.hint || '';
                              alert(`Kunde inte visa bild:\n${errorMsg}\n${details ? `\nDetaljer: ${details}` : ''}${hint ? `\n\nTips: ${hint}` : ''}`);
                            }
                          } catch (err) {
                            alert(`Kunde inte hämta bildlänk: ${err}`);
                          }
                        }}
                        style={{ padding: '4px 8px' }}
                        title="Öppna förhandsvisning i nytt fönster"
                      >
                        Visa bild
                      </button>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: 12 }}>Inget samtycke</span>
                    )}
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr>
                    <td colSpan={7} style={{ background: '#f9fafb', padding: 16, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>SHA256: {log.image_sha256}</div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{log.gpt_answer}</div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


