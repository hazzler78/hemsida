"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

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

  useEffect(() => {
    if (!authed) return;
    fetchProviders();
  }, [authed, activeTab]);

  const fetchProviders = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('page_providers')
        .select('*')
        .eq('type', activeTab)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setProviders(data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Kunde inte hämta leverantörer: ' + (error as Error).message);
    }
  };

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
      const supabase = getSupabase();
      if (provider.id) {
        // Update existing
        const { error } = await supabase
          .from('page_providers')
          .update({
            name: provider.name,
            type: provider.type,
            logo_url: provider.logo_url,
            description: provider.description,
            url: provider.url,
            is_recommended: provider.is_recommended,
            display_order: provider.display_order,
            active: provider.active,
          })
          .eq('id', provider.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('page_providers')
          .insert([{
            name: provider.name,
            type: provider.type,
            logo_url: provider.logo_url,
            description: provider.description,
            url: provider.url,
            is_recommended: provider.is_recommended,
            display_order: provider.display_order,
            active: provider.active,
          }]);
        
        if (error) throw error;
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
      const supabase = getSupabase();
      const { error } = await supabase
        .from('page_providers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
      const supabase = getSupabase();
      
      // Swap display_order values
      await supabase
        .from('page_providers')
        .update({ display_order: swapProvider.display_order })
        .eq('id', provider.id);
      
      await supabase
        .from('page_providers')
        .update({ display_order: provider.display_order })
        .eq('id', swapProvider.id);
      
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
              active: true
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

