"use client";

import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = "grodan2025";

interface PageProvider {
  id?: number;
  name: string;
  type: 'rorligt' | 'fastpris';
  logo_url: string;
  description: string;
  url: string;
  is_recommended: boolean;
  display_order: number;
  active: boolean;
  campaign_text?: string;
  campaign_bold?: boolean;
  campaign_italic?: boolean;
  best_price_badge_text?: string;
  /** Manuell månadskostnad (kr) – för leverantörer utan prisfil; används för sortering billigast först */
  manual_monthly_fee_kr?: number | null;
  /** Manuellt påslag (öre/kWh) – för leverantörer utan prisfil; används för sortering billigast först */
  manual_surcharge_ore_per_kwh?: number | null;
  /** Rörligt timpris, månadspris eller kvartspris – för manuella priser */
  manual_rate_type?: 'hourly' | 'monthly' | 'quarterly' | null;
}

export default function AdminProviders() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [providers, setProviders] = useState<PageProvider[]>([]);
  const [editingProvider, setEditingProvider] = useState<PageProvider | null>(null);
  const [activeTab, setActiveTab] = useState<'rorligt' | 'fastpris'>('rorligt');

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("admin_authed") === "true") setAuthed(true);
    }
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`/api/providers?type=${activeTab}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte hämta leverantörer');
      }
      
      setProviders(result.providers || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Kunde inte hämta leverantörer: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("admin_authed", "true");
      setError("");
    } else {
      setError("Fel lösenord!");
    }
  };

  const saveProvider = async (provider: PageProvider) => {
    try {
      const method = provider.id ? 'PUT' : 'POST';
      const response = await fetch('/api/providers', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(provider),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte spara leverantör');
      }
      
      if (!provider.id && result.id) {
        provider.id = result.id;
      }
      
      setSuccess('Leverantör sparad!');
      setEditingProvider(null);
      fetchProviders();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte spara: ' + (error as Error).message);
    }
  };

  const deleteProvider = async (id: number) => {
    if (!confirm('Är du säker på att du vill radera denna leverantör?')) return;
    
    try {
      const response = await fetch(`/api/providers?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte radera leverantör');
      }
      
      setSuccess('Leverantör raderad!');
      fetchProviders();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte radera: ' + (error as Error).message);
    }
  };

  const moveProvider = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = providers.findIndex(p => p.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= providers.length) return;
    
    const provider = providers[currentIndex];
    const swapProvider = providers[newIndex];
    
    try {
      // Swap display_order values
      await fetch('/api/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...provider,
          display_order: swapProvider.display_order,
        }),
      });
      
      await fetch('/api/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...swapProvider,
          display_order: provider.display_order,
        }),
      });
      
      fetchProviders();
    } catch (error) {
      setError('Kunde inte ändra ordning: ' + (error as Error).message);
    }
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: "4rem auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h2>Admininloggning - Leverantörer</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Lösenord"
            style={{ width: "100%", padding: 10, fontSize: 16, marginBottom: 12, borderRadius: 6, border: "1px solid #cbd5e1" }}
            autoFocus
          />
          <button type="submit" style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, background: "var(--primary)", color: "white", border: "none", fontWeight: 600 }}>
            Logga in
          </button>
        </form>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1>Hantera Leverantörer</h1>
        <p style={{ color: "#6b7280" }}>Hantera leverantörerna som visas på /rorligt-avtal och /fastpris-avtal sidorna</p>
      </div>
      
      {error && (
        <div style={{ 
          padding: "12px", 
          background: "#fef2f2", 
          border: "1px solid #fecaca", 
          borderRadius: 6, 
          color: "#dc2626", 
          marginBottom: 16 
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          padding: "12px", 
          background: "rgba(254,204,0,0.1)", 
          border: "1px solid var(--secondary)", 
          borderRadius: 6, 
          color: "black", 
          marginBottom: 16 
        }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10, borderBottom: "1px solid #e5e7eb" }}>
        <button 
          onClick={() => setActiveTab('rorligt')}
          style={{ 
            padding: "12px 20px", 
            background: activeTab === 'rorligt' ? "var(--primary)" : "#e5e7eb", 
            color: activeTab === 'rorligt' ? "white" : "black",
            border: "none", 
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === 'rorligt' ? "600" : "400"
          }}
        >
          Rörligt avtal
        </button>
        <button 
          onClick={() => setActiveTab('fastpris')}
          style={{ 
            padding: "12px 20px", 
            background: activeTab === 'fastpris' ? "var(--primary)" : "#e5e7eb", 
            color: activeTab === 'fastpris' ? "white" : "black",
            border: "none", 
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === 'fastpris' ? "600" : "400"
          }}
        >
          Fastpris avtal
        </button>
      </div>

      {/* Providers List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2>Leverantörer för {activeTab === 'rorligt' ? 'rörligt' : 'fastpris'} avtal</h2>
          <button 
            onClick={() => setEditingProvider({ 
              name: '', 
              type: activeTab,
              logo_url: '', 
              description: '', 
              url: '', 
              is_recommended: false,
              display_order: providers.length + 1,
              active: true,
              campaign_text: '',
              campaign_bold: false,
              campaign_italic: false,
              best_price_badge_text: '',
              manual_monthly_fee_kr: undefined,
              manual_surcharge_ore_per_kwh: undefined,
              manual_rate_type: undefined
            })}
            style={{ 
              padding: "8px 16px", 
              background: "var(--secondary)", 
              color: "black", 
              border: "none", 
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            + Lägg till leverantör
          </button>
        </div>

        {editingProvider && (
          <ProviderForm 
            provider={editingProvider}
            onSave={saveProvider}
            onCancel={() => setEditingProvider(null)}
          />
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {providers.map((provider, index) => (
            <div key={provider.id} style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              padding: 16,
              background: provider.active ? "white" : "#f9fafb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, color: provider.active ? "#374151" : "#9ca3af" }}>
                        {provider.name}
                      </h3>
                      {provider.is_recommended && (
                        <span style={{ 
                          background: "#10b981", 
                          color: "white", 
                          padding: "2px 8px", 
                          borderRadius: 12, 
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          Rekommenderat
                        </span>
                      )}
                      {!provider.active && (
                        <span style={{ 
                          background: "#9ca3af", 
                          color: "white", 
                          padding: "2px 8px", 
                          borderRadius: 12, 
                          fontSize: "12px"
                        }}>
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 4px 0", color: "#6b7280", fontSize: "14px" }}>
                      Logo: {provider.logo_url}
                    </p>
                    <p style={{ margin: "0 0 4px 0", color: "#6b7280", fontSize: "14px", wordBreak: "break-all" }}>
                      URL: {provider.url}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: provider.active ? "#374151" : "#9ca3af" }}>
                      {provider.description}
                    </p>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: "12px" }}>
                      Ordning: {provider.display_order}
                    </p>
                    {(provider.manual_monthly_fee_kr != null || provider.manual_surcharge_ore_per_kwh != null) && (
                      <p style={{ margin: "4px 0 0 0", color: "#059669", fontSize: "12px" }}>
                        Manuellt pris: {provider.manual_monthly_fee_kr ?? 0} kr/mån, {provider.manual_surcharge_ore_per_kwh ?? 0} öre/kWh
                        {provider.manual_rate_type === 'monthly' && ' (Rörligt månadspris)'}
                        {provider.manual_rate_type === 'hourly' && ' (Rörligt timpris)'}
                        {provider.manual_rate_type === 'quarterly' && ' (Rörligt kvartspris)'}
                      </p>
                    )}
                    {provider.campaign_text && (
                      <p style={{ 
                        margin: "8px 0 0 0", 
                        color: "#374151", 
                        fontSize: "14px",
                        fontWeight: provider.campaign_bold ? "bold" : "normal",
                        fontStyle: provider.campaign_italic ? "italic" : "normal"
                      }}>
                        Kampanj: {provider.campaign_text}
                      </p>
                    )}
                    {provider.best_price_badge_text && (
                      <p style={{ 
                        margin: "8px 0 0 0", 
                        color: "#9333ea", 
                        fontSize: "14px",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #a855f7, #9333ea)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      }}>
                        💜 Badge: {provider.best_price_badge_text}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button 
                      onClick={() => moveProvider(provider.id!, 'up')}
                      disabled={index === 0}
                      style={{ 
                        padding: "4px 8px", 
                        background: index === 0 ? "#e5e7eb" : "#6b7280", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 4,
                        cursor: index === 0 ? "not-allowed" : "pointer",
                        fontSize: "12px"
                      }}
                      title="Flytta upp"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveProvider(provider.id!, 'down')}
                      disabled={index === providers.length - 1}
                      style={{ 
                        padding: "4px 8px", 
                        background: index === providers.length - 1 ? "#e5e7eb" : "#6b7280", 
                        color: "white", 
                        border: "none", 
                        borderRadius: 4,
                        cursor: index === providers.length - 1 ? "not-allowed" : "pointer",
                        fontSize: "12px"
                      }}
                      title="Flytta ner"
                    >
                      ↓
                    </button>
                  </div>
                  <button 
                    onClick={() => setEditingProvider(provider)}
                    style={{ 
                      padding: "6px 12px", 
                      background: "var(--primary)", 
                      color: "white", 
                      border: "none", 
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}
                  >
                    Redigera
                  </button>
                  <button 
                    onClick={() => deleteProvider(provider.id!)}
                    style={{ 
                      padding: "6px 12px", 
                      background: "#dc2626", 
                      color: "white", 
                      border: "none", 
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}
                  >
                    Radera
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Form Component
function ProviderForm({ provider, onSave, onCancel }: { 
  provider: PageProvider; 
  onSave: (provider: PageProvider) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(provider);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      border: "1px solid #e5e7eb", 
      borderRadius: 8, 
      padding: 20, 
      marginBottom: 20,
      background: "#f9fafb"
    }}>
      <h3>{provider.id ? 'Redigera' : 'Lägg till'} leverantör</h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Namn:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Typ:</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value as 'rorligt' | 'fastpris'})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        >
          <option value="rorligt">Rörligt</option>
          <option value="fastpris">Fastpris</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Logo URL (t.ex. /cheap-logo.png):</label>
        <input
          type="text"
          value={formData.logo_url}
          onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="/cheap-logo.png"
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Beskrivning:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db", minHeight: 80 }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>URL:</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({...formData, url: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Ordning:</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
            min="0"
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: 16, padding: "12px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
        <div style={{ fontWeight: "600", marginBottom: 8, color: "#166534" }}>Manuellt pris (rörligt)</div>
        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#15803d" }}>
          Används för leverantörer utan prisfil (t.ex. Tibber, Vattenfall). Sidan /rorligt-avtal sorterar billigast först utifrån detta eller automatiska priser.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "500" }}>Månadskostnad (kr):</label>
            <input
              type="number"
              step="any"
              value={formData.manual_monthly_fee_kr ?? ''}
              onChange={(e) => setFormData({...formData, manual_monthly_fee_kr: e.target.value === '' ? undefined : Number(e.target.value)})}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
              placeholder="t.ex. 49"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: "500" }}>Påslag (öre/kWh):</label>
            <input
              type="number"
              step="any"
              value={formData.manual_surcharge_ore_per_kwh ?? ''}
              onChange={(e) => setFormData({...formData, manual_surcharge_ore_per_kwh: e.target.value === '' ? undefined : Number(e.target.value)})}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
              placeholder="t.ex. 9.9"
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "500" }}>Pristyp (rörligt):</label>
          <select
            value={formData.manual_rate_type ?? ''}
            onChange={(e) => setFormData({...formData, manual_rate_type: (e.target.value === '' ? undefined : e.target.value) as 'hourly' | 'monthly' | 'quarterly' | undefined})}
            style={{ width: "100%", maxWidth: 280, padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            <option value="">— Välj om manuellt —</option>
            <option value="hourly">Rörligt timpris</option>
            <option value="monthly">Rörligt månadspris</option>
            <option value="quarterly">Rörligt kvartspris</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={formData.is_recommended}
            onChange={(e) => setFormData({...formData, is_recommended: e.target.checked})}
          />
          Rekommenderat (visa badge)
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({...formData, active: e.target.checked})}
          />
          Aktiv
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Kampanjtext (t.ex. &quot;KAMPANJ&quot;):</label>
        <input
          type="text"
          value={formData.campaign_text || ''}
          onChange={(e) => setFormData({...formData, campaign_text: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="T.ex. KAMPANJ"
        />
        <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={formData.campaign_bold || false}
              onChange={(e) => setFormData({...formData, campaign_bold: e.target.checked})}
            />
            Fet text
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={formData.campaign_italic || false}
              onChange={(e) => setFormData({...formData, campaign_italic: e.target.checked})}
            />
            Kursiv text
          </label>
        </div>
        {formData.campaign_text && (
          <div style={{ marginTop: 8, padding: 8, background: "#f3f4f6", borderRadius: 4 }}>
            <span style={{ 
              fontWeight: formData.campaign_bold ? "bold" : "normal",
              fontStyle: formData.campaign_italic ? "italic" : "normal"
            }}>
              Förhandsvisning: {formData.campaign_text}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Lila badge-text (t.ex. &quot;Vi har sveriges billigaste elavtal&quot;):</label>
        <input
          type="text"
          value={formData.best_price_badge_text || ''}
          onChange={(e) => setFormData({...formData, best_price_badge_text: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="T.ex. Vi har sveriges billigaste elavtal"
        />
        <div style={{ marginTop: 4, fontSize: "12px", color: "#6b7280" }}>
          Om denna text är ifylld visas en lila badge överst på kortet på rörligt-avtal-v2 sidan.
        </div>
        {formData.best_price_badge_text && (
          <div style={{ marginTop: 8, padding: 8, background: "linear-gradient(135deg, #a855f7, #9333ea)", borderRadius: 4, color: "white", fontWeight: "600", fontSize: "14px" }}>
            Förhandsvisning: {formData.best_price_badge_text}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={{ 
          padding: "8px 16px", 
          background: "var(--secondary)", 
          color: "black", 
          border: "none", 
          borderRadius: 6,
          cursor: "pointer"
        }}>
          Spara
        </button>
        <button type="button" onClick={onCancel} style={{ 
          padding: "8px 16px", 
          background: "#6b7280", 
          color: "white", 
          border: "none", 
          borderRadius: 6,
          cursor: "pointer"
        }}>
          Avbryt
        </button>
      </div>
    </form>
  );
}

