"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

const ADMIN_PASSWORD = "grodan2025";

interface KnowledgeItem {
  id?: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  lastUpdated: string;
  active: boolean;
}

// Typ för databassvar (snake_case för timestamp)
type DbKnowledgeRow = {
  id?: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  last_updated?: string;
  lastUpdated?: string;
  active: boolean;
};

// Typ för databasrad från ai_campaigns (kan vara snake_case eller camelCase)
type DbCampaignRow = {
  id?: number;
  title: string;
  description: string;
  validFrom?: string;
  validTo?: string;
  valid_from?: string;
  valid_to?: string;
  active: boolean;
};

interface CampaignInfo {
  id?: number;
  title: string;
  description: string;
  validFrom: string;
  validTo: string;
  active: boolean;
}

interface ProviderInfo {
  id?: number;
  name: string;
  type: 'rorligt' | 'fastpris' | 'foretag';
  features: string[];
  url: string;
  active: boolean;
}

export default function AdminKnowledge() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Knowledge items
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeItem | null>(null);
  
  // Campaigns
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<CampaignInfo | null>(null);
  
  // Providers
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [editingProvider, setEditingProvider] = useState<ProviderInfo | null>(null);
  
  const [activeTab, setActiveTab] = useState<'knowledge' | 'campaigns' | 'providers'>('knowledge');

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("admin_authed") === "true") setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchKnowledgeData();
  }, [authed]);

  const fetchKnowledgeData = async () => {
    try {
      // Fetch knowledge items
      const supabase = getSupabase();
      const { data: knowledgeData } = await supabase
        .from('ai_knowledge')
        .select('*')
        .order('category', { ascending: true });
      
      if (knowledgeData) {
        // Map DB snake_case to UI camelCase for timestamps
        const mapped: KnowledgeItem[] = (knowledgeData as DbKnowledgeRow[]).map((k) => ({
          id: k.id,
          category: k.category,
          question: k.question,
          answer: k.answer,
          keywords: k.keywords,
          active: k.active,
          lastUpdated: k.lastUpdated || k.last_updated || new Date().toISOString(),
        }));
        setKnowledgeItems(mapped);
      }

      // Fetch campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from('ai_campaigns')
        .select('*')
        .order('title', { ascending: true });
      
      if (campaignError) {
        console.error('Error fetching campaigns:', campaignError);
        setError('Kunde inte hämta kampanjer: ' + campaignError.message);
        return;
      }
      
      if (campaignData && campaignData.length > 0) {
        // Log column names for debugging
        console.log('Campaign columns found:', Object.keys(campaignData[0]));
        console.log('Sample campaign data:', campaignData[0]);
        
        // Map snake_case to camelCase for UI consistency
        const mapped: CampaignInfo[] = campaignData.map((c: DbCampaignRow) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          validFrom: c.valid_from || c.validFrom || '',
          validTo: c.valid_to || c.validTo || '',
          active: c.active,
        }));
        setCampaigns(mapped);
      }

      // Fetch providers
      const { data: providerData } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name', { ascending: true });
      
      if (providerData) {
        setProviders(providerData);
      }
    } catch (error) {
      console.error('Error fetching knowledge data:', error);
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

  const saveKnowledgeItem = async (item: KnowledgeItem) => {
    try {
      if (item.id) {
        // Update existing
        const supabase = getSupabase();
        const { error } = await supabase
          .from('ai_knowledge')
          .update({
            category: item.category,
            question: item.question,
            answer: item.answer,
            keywords: item.keywords,
            active: item.active,
            // Use snake_case column in DB
            last_updated: new Date().toISOString(),
          })
          .eq('id', item.id);
        
        if (error) throw error;
      } else {
        // Create new
        const supabase = getSupabase();
        const { error } = await supabase
          .from('ai_knowledge')
          .insert([{
            category: item.category,
            question: item.question,
            answer: item.answer,
            keywords: item.keywords,
            active: item.active,
            // Use snake_case column in DB
            last_updated: new Date().toISOString(),
          }]);
        
        if (error) throw error;
      }
      
      setSuccess('Kunskapsartikel sparad!');
      setEditingKnowledge(null);
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte spara: ' + (error as Error).message);
    }
  };

  const saveCampaign = async (campaign: CampaignInfo) => {
    try {
      const supabase = getSupabase();
      
      // Try snake_case first (Supabase/PostgreSQL convention)
      type DbCampaignPayload = {
        title: string;
        description: string;
        active: boolean;
        valid_from?: string;
        valid_to?: string;
        validFrom?: string;
        validTo?: string;
      };
      
      let dbCampaign: DbCampaignPayload = {
        title: campaign.title,
        description: campaign.description,
        active: campaign.active,
        valid_from: campaign.validFrom,
        valid_to: campaign.validTo,
      };
      
      if (campaign.id) {
        // Update existing
        let { error } = await supabase
          .from('ai_campaigns')
          .update(dbCampaign)
          .eq('id', campaign.id);
        
        // If snake_case fails, try camelCase (in case column was created with quotes)
        if (error && (error.message.includes('valid_from') || error.message.includes('validFrom'))) {
          console.log('Trying camelCase fallback:', error.message);
          dbCampaign = {
            title: campaign.title,
            description: campaign.description,
            active: campaign.active,
            validFrom: campaign.validFrom,
            validTo: campaign.validTo,
          } as DbCampaignPayload;
          const retry = await supabase
            .from('ai_campaigns')
            .update(dbCampaign)
            .eq('id', campaign.id);
          error = retry.error;
        }
        
        if (error) {
          console.error('Campaign update error:', error);
          // Provide helpful error message
          if (error.message.includes('validFrom') || error.message.includes('valid_from')) {
            throw new Error('Kolumnnamn hittades inte. Kör migration: supabase-fix-campaign-columns.sql i Supabase SQL Editor för att fixa kolumnnamnen.');
          }
          throw error;
        }
      } else {
        // Create new
        let { error } = await supabase
          .from('ai_campaigns')
          .insert([dbCampaign]);
        
        // If snake_case fails, try camelCase
        if (error && (error.message.includes('valid_from') || error.message.includes('validFrom'))) {
          console.log('Trying camelCase fallback:', error.message);
          dbCampaign = {
            title: campaign.title,
            description: campaign.description,
            active: campaign.active,
            validFrom: campaign.validFrom,
            validTo: campaign.validTo,
          } as DbCampaignPayload;
          const retry = await supabase
            .from('ai_campaigns')
            .insert([dbCampaign]);
          error = retry.error;
        }
        
        if (error) {
          console.error('Campaign insert error:', error);
          // Provide helpful error message
          if (error.message.includes('validFrom') || error.message.includes('valid_from')) {
            throw new Error('Kolumnnamn hittades inte. Kör migration: supabase-fix-campaign-columns.sql i Supabase SQL Editor för att fixa kolumnnamnen.');
          }
          throw error;
        }
      }
      
      setSuccess('Kampanj sparad!');
      setEditingCampaign(null);
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte spara: ' + (error as Error).message);
    }
  };

  const saveProvider = async (provider: ProviderInfo) => {
    const supabase = getSupabase();
    try {
      if (provider.id) {
        // Update existing
        const { error } = await supabase
          .from('ai_providers')
          .update(provider)
          .eq('id', provider.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('ai_providers')
          .insert([provider]);
        
        if (error) throw error;
      }
      
      setSuccess('Leverantör sparad!');
      setEditingProvider(null);
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte spara: ' + (error as Error).message);
    }
  };

  const deleteKnowledgeItem = async (id: number) => {
    if (!confirm('Är du säker på att du vill radera denna kunskapsartikel?')) return;
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('ai_knowledge')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccess('Kunskapsartikel raderad!');
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte radera: ' + (error as Error).message);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Är du säker på att du vill radera denna kampanj?')) return;
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('ai_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccess('Kampanj raderad!');
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte radera: ' + (error as Error).message);
    }
  };

  const deleteProvider = async (id: number) => {
    if (!confirm('Är du säker på att du vill radera denna leverantör?')) return;
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccess('Leverantör raderad!');
      fetchKnowledgeData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Kunde inte radera: ' + (error as Error).message);
    }
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: "4rem auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h2>Admininloggning - Kunskapsbas</h2>
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
      <h1>AI Kunskapsbas - Admin</h1>
      
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
          onClick={() => setActiveTab('knowledge')}
          style={{ 
            padding: "12px 20px", 
            background: activeTab === 'knowledge' ? "var(--primary)" : "#e5e7eb", 
            color: activeTab === 'knowledge' ? "white" : "black",
            border: "none", 
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === 'knowledge' ? "600" : "400"
          }}
        >
          Kunskapsartiklar
        </button>
        <button 
          onClick={() => setActiveTab('campaigns')}
          style={{ 
            padding: "12px 20px", 
            background: activeTab === 'campaigns' ? "var(--primary)" : "#e5e7eb", 
            color: activeTab === 'campaigns' ? "white" : "black",
            border: "none", 
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === 'campaigns' ? "600" : "400"
          }}
        >
          Kampanjer
        </button>
        <button 
          onClick={() => setActiveTab('providers')}
          style={{ 
            padding: "12px 20px", 
            background: activeTab === 'providers' ? "var(--primary)" : "#e5e7eb", 
            color: activeTab === 'providers' ? "white" : "black",
            border: "none", 
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: activeTab === 'providers' ? "600" : "400"
          }}
        >
          Leverantörer
        </button>
      </div>

      {/* Knowledge Items Tab */}
      {activeTab === 'knowledge' && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2>Kunskapsartiklar</h2>
            <button 
              onClick={() => setEditingKnowledge({ 
                category: '', 
                question: '', 
                answer: '', 
                keywords: [], 
                lastUpdated: new Date().toISOString(),
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
              + Lägg till artikel
            </button>
          </div>

          {editingKnowledge && (
            <KnowledgeForm 
              item={editingKnowledge}
              onSave={saveKnowledgeItem}
              onCancel={() => setEditingKnowledge(null)}
            />
          )}

          <div style={{ display: "grid", gap: "16px" }}>
            {knowledgeItems.map((item) => (
              <div key={item.id} style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: 8, 
                padding: 16,
                background: item.active ? "white" : "#f9fafb"
              }}>
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: "0 0 8px 0", color: item.active ? "#374151" : "#9ca3af" }}>
                      {item.question}
                    </h3>
                    <p style={{ margin: "0 0 4px 0", color: "#6b7280", fontSize: "14px" }}>
                      Kategori: {item.category}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
                      Uppdaterad: {new Date(item.lastUpdated).toLocaleDateString('sv-SE')}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: item.active ? "#374151" : "#9ca3af" }}>
                      {item.answer}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {item.keywords.map((keyword, idx) => (
                        <span key={idx} style={{ 
                          background: "#e5e7eb", 
                          padding: "2px 8px", 
                          borderRadius: 12, 
                          fontSize: "12px",
                          color: "#374151"
                        }}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => setEditingKnowledge(item)}
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
                      onClick={() => deleteKnowledgeItem(item.id!)}
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
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2>Kampanjer</h2>
            <button 
              onClick={() => setEditingCampaign({ 
                title: '', 
                description: '', 
                validFrom: new Date().toISOString().split('T')[0], 
                validTo: new Date().toISOString().split('T')[0], 
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
              + Lägg till kampanj
            </button>
          </div>

          {editingCampaign && (
            <CampaignForm 
              campaign={editingCampaign}
              onSave={saveCampaign}
              onCancel={() => setEditingCampaign(null)}
            />
          )}

          <div style={{ display: "grid", gap: "16px" }}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: 8, 
                padding: 16,
                background: campaign.active ? "white" : "#f9fafb"
              }}>
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: "0 0 8px 0", color: campaign.active ? "#374151" : "#9ca3af" }}>
                      {campaign.title}
                    </h3>
                    <p style={{ margin: "0 0 8px 0", color: "#6b7280" }}>
                      {campaign.description}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
                      Gäller: {new Date(campaign.validFrom).toLocaleDateString('sv-SE')} - {new Date(campaign.validTo).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => setEditingCampaign(campaign)}
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
                      onClick={() => deleteCampaign(campaign.id!)}
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
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2>Leverantörer</h2>
            <button 
              onClick={() => setEditingProvider({ 
                name: '', 
                type: 'rorligt', 
                features: [], 
                url: '', 
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
            {providers.map((provider) => (
              <div key={provider.id} style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: 8, 
                padding: 16,
                background: provider.active ? "white" : "#f9fafb"
              }}>
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: "0 0 8px 0", color: provider.active ? "#374151" : "#9ca3af" }}>
                      {provider.name}
                    </h3>
                    <p style={{ margin: "0 0 4px 0", color: "#6b7280", fontSize: "14px" }}>
                      Typ: {provider.type}
                    </p>
                    <p style={{ 
                      margin: "0 0 8px 0", 
                      color: "#6b7280", 
                      fontSize: "14px",
                      wordBreak: "break-all",
                      maxWidth: "100%"
                    }}>
                      URL: {provider.url}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {provider.features.map((feature, idx) => (
                        <span key={idx} style={{ 
                          background: "#e5e7eb", 
                          padding: "2px 8px", 
                          borderRadius: 12, 
                          fontSize: "12px",
                          color: "#374151"
                        }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
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
      )}
    </div>
  );
}

// Form Components
function KnowledgeForm({ item, onSave, onCancel }: { 
  item: KnowledgeItem; 
  onSave: (item: KnowledgeItem) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(item);
  const [keywordsInput, setKeywordsInput] = useState(item.keywords.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      keywords: keywordsInput.split(',').map(k => k.trim()).filter(k => k)
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      border: "1px solid #e5e7eb", 
      borderRadius: 8, 
      padding: 20, 
      marginBottom: 20,
      background: "#f9fafb"
    }}>
      <h3>{item.id ? 'Redigera' : 'Lägg till'} kunskapsartikel</h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Kategori:</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Fråga:</label>
        <input
          type="text"
          value={formData.question}
          onChange={(e) => setFormData({...formData, question: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Svar:</label>
        <textarea
          value={formData.answer}
          onChange={(e) => setFormData({...formData, answer: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db", minHeight: 100 }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Nyckelord (kommaseparerade):</label>
        <input
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="hitta, bra, erbjudanden, registrera"
        />
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

function CampaignForm({ campaign, onSave, onCancel }: { 
  campaign: CampaignInfo; 
  onSave: (campaign: CampaignInfo) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(campaign);

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
      <h3>{campaign.id ? 'Redigera' : 'Lägg till'} kampanj</h3>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Titel:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Gäller från:</label>
          <input
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
            required
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Gäller till:</label>
          <input
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData({...formData, validTo: e.target.value})}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
            required
          />
        </div>
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

function ProviderForm({ provider, onSave, onCancel }: { 
  provider: ProviderInfo; 
  onSave: (provider: ProviderInfo) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(provider);
  const [featuresInput, setFeaturesInput] = useState(provider.features.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      features: featuresInput.split(',').map(f => f.trim()).filter(f => f)
    });
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
          onChange={(e) => setFormData({...formData, type: e.target.value as 'rorligt' | 'fastpris' | 'foretag'})}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          required
        >
          <option value="rorligt">Rörligt</option>
          <option value="fastpris">Fastpris</option>
          <option value="foretag">Företag</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: "600" }}>Funktioner (kommaseparerade):</label>
        <input
          type="text"
          value={featuresInput}
          onChange={(e) => setFeaturesInput(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="0 kr månadsavgift, 0 öre påslag, Ingen bindningstid"
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
