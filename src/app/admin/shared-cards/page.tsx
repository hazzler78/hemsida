"use client";

import React, { useEffect, useState } from 'react';

type Card = { id: number; title: string; summary: string; url: string; image_url?: string | null; created_at: string };

export default function AdminSharedCards() {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shared-cards?limit=200', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      const msg = (e as Error)?.message || 'Kunde inte hämta data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function normalize(id: number) {
    await fetch('/api/shared-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await load();
  }

  async function save(item: Card) {
    const payload = { id: item.id, title: item.title, summary: item.summary, url: item.url, image_url: item.image_url };
    await fetch('/api/shared-cards', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/shared-cards?id=${id}`, { method: 'DELETE' });
    await load();
  }

  if (loading) return <div style={{padding: 24}}>Laddar…</div>;
  if (error) return <div style={{padding: 24, color: 'red'}}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Delade länkar</h1>
      <p>Hantera kort som delats via Telegram (ändra, normalisera, ta bort).</p>
      {items.length === 0 && <p>Inga kort ännu.</p>}
      <div style={{ display: 'grid', gap: 16 }}>
        {items.map(item => (
          <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <strong>#{item.id}</strong>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(item.created_at).toLocaleString('sv-SE')}</div>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={
                    item.title
                      ? `${item.title} – delad bild från elavtal jämförelse`
                      : 'Delad bild från elavtal jämförelse med Elchef'
                  }
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <input style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} value={item.title} onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, title: e.target.value } : p))} />
              <textarea style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 120 }} value={item.summary} onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, summary: e.target.value } : p))} />
              <input style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} value={item.url} onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, url: e.target.value } : p))} />
              <input placeholder="Bild-URL (valfri)" style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} value={item.image_url || ''} onChange={e => setItems(prev => prev.map(p => p.id === item.id ? { ...p, image_url: e.target.value } : p))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => save(item)} style={{ padding: '8px 12px', background: 'var(--primary)', color: '#fff', borderRadius: 8, border: 'none' }}>Spara</button>
              <button onClick={() => normalize(item.id)} style={{ padding: '8px 12px', background: 'var(--secondary)', color: '#000', borderRadius: 8, border: 'none' }}>Normalisera</button>
              <button onClick={() => remove(item.id)} style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', borderRadius: 8, border: 'none' }}>Ta bort</button>
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none' }}>Öppna</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


