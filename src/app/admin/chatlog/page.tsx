"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Markdown rendering function (copied from GrokChat.tsx)
function renderMarkdown(text: unknown) {
  if (text == null) return '';
  const source = typeof text === 'string' ? text : String(text);
  if (!source) return '';
  
  let html = source
    // Escape HTML to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Headers (h1-h6)
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 600; margin: 8px 0 4px 0; color: #374151;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: 600; margin: 12px 0 6px 0; color: #374151;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 20px; font-weight: 600; margin: 16px 0 8px 0; color: #374151;">$1</h1>');
  
  // Bold and italic (handle nested cases)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // ***bold italic***
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>'); // **bold**
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>'); // *italic*
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 13px;">$1</code>');
  
  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; font-size: 13px;"><code style="font-family: monospace; white-space: pre;">$1</code></pre>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$1</a>');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 8px 0; color: #6b7280; font-style: italic;">$1</blockquote>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0;">$1</li>');
  
  // Bullet lists (improved regex)
  html = html.replace(/^[\s]*[-*+] (.*$)/gim, '<li style="margin: 4px 0;">$1</li>');
  
  // Wrap lists in ul/ol tags
  const lines = html.split('\n');
  let inList = false;
  let listType = '';
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNumberedList = /^\d+\. /.test(line);
    const isBulletList = /^[\s]*[-*+] /.test(line);
    
    if (isNumberedList || isBulletList) {
      if (!inList) {
        inList = true;
        listType = isNumberedList ? 'ol' : 'ul';
        result.push(`<${listType} style="margin: 8px 0; padding-left: 20px;">`);
      }
      result.push(line);
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = '';
      }
      result.push(line);
    }
  }
  
  if (inList) {
    result.push(`</${listType}>`);
  }
  
  return result.join('\n');
}


type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatLogType = {
  id: number;
  created_at: string;
  session_id: string;
  user_agent: string;
  messages: ChatMessage[];
  ai_response: string;
  total_tokens: number;
};

type SessionGroup = {
  session_id: string;
  logs: ChatLogType[];
  total_messages: number;
  first_message: string;
  last_message: string;
};

export default function AdminChatlog() {
  const [logs, setLogs] = useState<ChatLogType[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"raw" | "grouped">("grouped");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
    const { data, error } = await supabase
      .from("chatlog")
      .select("id, created_at, session_id, user_agent, messages, ai_response, total_tokens")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const logsData = data as ChatLogType[];
      setLogs(logsData);
      
      // Gruppera efter session_id
      const groups: { [key: string]: ChatLogType[] } = {};
      logsData.forEach(log => {
        if (!groups[log.session_id]) {
          groups[log.session_id] = [];
        }
        groups[log.session_id].push(log);
      });
      
      const sessionGroupsData: SessionGroup[] = Object.entries(groups).map(([session_id, logs]) => ({
        session_id,
        logs: logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        total_messages: logs.reduce((sum, log) => sum + (log.messages?.length || 0), 0),
        first_message: logs[0]?.created_at || "",
        last_message: logs[logs.length - 1]?.created_at || "",
      }));
      
      setSessionGroups(sessionGroupsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const rateLog = async (id: number, rating: number) => {
    setSaving(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
      await supabase.from('chat_feedback').insert([{ chatlog_id: id, rating }]);
      alert(`Betyg ${rating}/5 sparat`);
    } catch {}
    setSaving(false);
  };

  const exportJSON = () => {
    const payload = viewMode === 'grouped' ? sessionGroups : logs;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = viewMode === 'grouped' ? 'chat_sessions.json' : 'chat_logs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push(['id','session_id','created_at','user_message','ai_response','total_tokens'].join(','));
    logs.forEach(l => {
      const lastUser = (l.messages || []).filter(m => m.role === 'user').slice(-1)[0]?.content || '';
      const vals = [
        String(l.id),
        '"' + (l.session_id || '').replace(/"/g,'""') + '"',
        '"' + l.created_at + '"',
        '"' + (lastUser || '').replace(/"/g,'""').replace(/\n/g,' ') + '"',
        '"' + (l.ai_response || '').replace(/"/g,'""').replace(/\n/g,' ') + '"',
        String(l.total_tokens || 0)
      ];
      rows.push(vals.join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteLog = async (id: number) => {
    if (!confirm("Är du säker på att du vill radera denna logg?")) return;
    
    setDeleting(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
      const { error } = await supabase
        .from("chatlog")
        .delete()
        .eq("id", id);
      
      if (error) {
        setError("Kunde inte radera logg: " + error.message);
      } else {
        await fetchLogs(); // Uppdatera listan
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch {
      setError("Ett fel uppstod vid radering");
    } finally {
      setDeleting(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Är du säker på att du vill radera hela denna session?")) return;
    
    setDeleting(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
      const { error } = await supabase
        .from("chatlog")
        .delete()
        .eq("session_id", sessionId);
      
      if (error) {
        setError("Kunde inte radera session: " + error.message);
      } else {
        await fetchLogs(); // Uppdatera listan
        setSelectedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      }
    } catch {
      setError("Ett fel uppstod vid radering");
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0 && selectedSessions.size === 0) return;
    
    const message = viewMode === "grouped" 
      ? `Är du säker på att du vill radera ${selectedSessions.size} sessioner?`
      : `Är du säker på att du vill radera ${selectedItems.size} loggar?`;
    
    if (!confirm(message)) return;
    
    setDeleting(true);
    try {
      if (viewMode === "grouped" && selectedSessions.size > 0) {
        // Radera alla loggar för valda sessioner
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        );
        const { error } = await supabase
          .from("chatlog")
          .delete()
          .in("session_id", Array.from(selectedSessions));
        
        if (error) {
          setError("Kunde inte radera sessioner: " + error.message);
        } else {
          await fetchLogs();
          setSelectedSessions(new Set());
        }
      } else if (viewMode === "raw" && selectedItems.size > 0) {
        // Radera valda loggar
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        );
        const { error } = await supabase
          .from("chatlog")
          .delete()
          .in("id", Array.from(selectedItems));
        
        if (error) {
          setError("Kunde inte radera loggar: " + error.message);
        } else {
          await fetchLogs();
          setSelectedItems(new Set());
        }
      }
    } catch {
      setError("Ett fel uppstod vid radering");
    } finally {
      setDeleting(false);
    }
  };

  const cleanupDuplicateData = async () => {
    if (!confirm("Detta kommer att rensa bort duplicerad konversationsdata från befintliga loggar. Endast det aktuella meddelandeutbytet kommer att behållas för varje logg. Är du säker?")) return;
    
    setDeleting(true);
    try {
      // Hämta alla loggar
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
      const { data: allLogs, error: fetchError } = await supabase
        .from("chatlog")
        .select("*");
      
      if (fetchError) {
        setError("Kunde inte hämta loggar: " + fetchError.message);
        return;
      }
      
      // Uppdatera varje logg för att bara innehålla det aktuella utbytet
      for (const log of allLogs || []) {
        if (log.messages && Array.isArray(log.messages) && log.messages.length > 2) {
          // Om det finns mer än 2 meddelanden (user + assistant), behåll bara de sista två
          const currentExchange = log.messages.slice(-2);
          
          const { error: updateError } = await supabase
            .from("chatlog")
            .update({ messages: currentExchange })
            .eq("id", log.id);
          
          if (updateError) {
            console.error("Fel vid uppdatering av logg", log.id, updateError);
          }
        }
      }
      
      await fetchLogs(); // Uppdatera listan
      setError(""); // Rensa eventuella fel
    } catch (err) {
      setError("Ett fel uppstod vid rensning: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectSession = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (viewMode === "grouped") {
      setSelectedSessions(new Set(sessionGroups.map(g => g.session_id)));
    } else {
      setSelectedItems(new Set(logs.map(l => l.id)));
    }
  };

  const selectNone = () => {
    setSelectedItems(new Set());
    setSelectedSessions(new Set());
  };



  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: 24 }}>
      <h1>AI Chatlogg (Admin)</h1>
      
      <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button 
          onClick={() => setViewMode("grouped")}
          style={{ 
            padding: "8px 16px", 
            background: viewMode === "grouped" ? "var(--primary)" : "#e5e7eb", 
            color: viewMode === "grouped" ? "white" : "black",
            border: "none", 
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Grupperad vy
        </button>
        <button 
          onClick={() => setViewMode("raw")}
          style={{ 
            padding: "8px 16px", 
            background: viewMode === "raw" ? "var(--primary)" : "#e5e7eb", 
            color: viewMode === "raw" ? "white" : "black",
            border: "none", 
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Raw vy
        </button>
        <span style={{ fontSize: 14, color: "#666" }}>
          {viewMode === "grouped" ? `${sessionGroups.length} sessioner` : `${logs.length} meddelanden`}
        </span>
        <button onClick={exportJSON} style={{ padding: "8px 16px", background: "#0ea5e9", color: "white", border: "none", borderRadius: 6 }}>Export JSON</button>
        <button onClick={exportCSV} style={{ padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: 6 }}>Export CSV</button>
        
        {/* Cleanup button */}
        <button
          onClick={cleanupDuplicateData}
          disabled={deleting}
          style={{
            padding: "8px 16px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: deleting ? "not-allowed" : "pointer",
            fontSize: 14
          }}
          title="Rensa duplicerad konversationsdata från befintliga loggar"
        >
          {deleting ? "Rensar..." : "🧹 Rensa duplicerad data"}
        </button>
        
        {/* Bulk actions */}
        {(selectedItems.size > 0 || selectedSessions.size > 0) && (
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button
              onClick={deleteSelected}
              disabled={deleting}
              style={{
                padding: "6px 12px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: 12
              }}
            >
              {deleting ? "Raderar..." : `Radera valda (${viewMode === "grouped" ? selectedSessions.size : selectedItems.size})`}
            </button>
            <button
              onClick={cleanupDuplicateData}
              disabled={deleting}
              style={{
                padding: "6px 12px",
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: 12
              }}
            >
              {deleting ? "Rensar..." : "Rensa duplicerad data"}
            </button>
            <button
              onClick={selectNone}
              style={{
                padding: "6px 12px",
                background: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12
              }}
            >
              Avmarkera alla
            </button>
          </div>
        )}
        
        {/* Select all */}
        {!loading && logs.length > 0 && (
          <button
            onClick={selectAll}
            style={{
              padding: "6px 12px",
              background: "var(--secondary)",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12
            }}
          >
            Markera alla
          </button>
        )}
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

      {loading && <p>Laddar loggar...</p>}
      {!loading && logs.length === 0 && <p>Inga loggar hittades.</p>}
      
      {!loading && logs.length > 0 && viewMode === "raw" && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: 8, border: "1px solid #e5e7eb", width: 30 }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size === logs.length && logs.length > 0}
                  onChange={selectAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th style={{ padding: 8, border: "1px solid #e5e7eb" }}>Datum</th>
              <th style={{ padding: 8, border: "1px solid #e5e7eb" }}>Session</th>
              <th style={{ padding: 8, border: "1px solid #e5e7eb" }}>Antal meddelanden</th>
              <th style={{ padding: 8, border: "1px solid #e5e7eb" }}>User Agent</th>
              <th style={{ padding: 8, border: "1px solid #e5e7eb" }}>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(log.id)}
                      onChange={() => toggleSelectItem(log.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb", fontSize: 12 }}>{log.session_id}</td>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>{log.messages?.length || 0}</td>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb", fontSize: 12 }}>{log.user_agent}</td>
                  <td style={{ padding: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button onClick={() => setExpanded(expanded === log.session_id ? null : log.session_id)} style={{ fontSize: 14 }}>
                        {expanded === log.session_id ? "Dölj" : "Visa"}
                      </button>
                      <button 
                        onClick={() => deleteLog(log.id)}
                        disabled={deleting}
                        style={{ 
                          fontSize: 14, 
                          background: "#dc2626", 
                          color: "white", 
                          border: "none", 
                          borderRadius: 4,
                          padding: "2px 6px",
                          cursor: deleting ? "not-allowed" : "pointer"
                        }}
                      >
                        🗑
                      </button>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Betyg:</span>
                        {[1,2,3,4,5].map((r) => (
                          <button key={r} onClick={() => rateLog(log.id, r)} disabled={saving} style={{ padding: "2px 6px", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
                {expanded === log.session_id && (
                  <tr>
                    <td colSpan={6} style={{ background: "#f9fafb", padding: 16, border: "1px solid #e5e7eb" }}>
                      <b>Konversation:</b>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {log.messages?.map((msg, idx) => (
                          <li key={idx} style={{ margin: "8px 0" }}>
                            <div style={{ marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600, fontSize: "14px" }}>{msg.role === "user" ? "Du" : "Grodan"}:</span>
                            </div>
                            <div 
                              style={{ 
                                fontSize: "14px", 
                                lineHeight: "1.5",
                                padding: "8px 12px",
                                background: msg.role === "user" ? "#f0f9ff" : "#f8fafc",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0"
                              }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                            />
                          </li>
                        ))}
                      </ul>
                      <div style={{ marginTop: "12px" }}>
                        <b style={{ fontSize: "14px" }}>AI-svar:</b>
                        <div 
                          style={{ 
                            marginTop: "4px",
                            fontSize: "14px", 
                            lineHeight: "1.5",
                            padding: "8px 12px",
                            background: "#f0f9ff",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0"
                          }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(log.ai_response) }}
                        />
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Tokens: {log.total_tokens}</div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {!loading && sessionGroups.length > 0 && viewMode === "grouped" && (
        <div style={{ marginTop: 24 }}>
          {sessionGroups.map((group) => (
            <div key={group.session_id} style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              marginBottom: 16, 
              background: selectedSessions.has(group.session_id) ? "#f0f9ff" : "white" 
            }}>
              <div style={{ 
                padding: "12px 16px", 
                background: "#f8fafc", 
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(group.session_id)}
                    onChange={() => toggleSelectSession(group.session_id)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <strong>Session: {group.session_id}</strong>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {group.logs.length} meddelanden • {group.total_messages} totalt • 
                      {new Date(group.first_message).toLocaleString()} - {new Date(group.last_message).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button 
                    onClick={() => setExpanded(expanded === group.session_id ? null : group.session_id)}
                    style={{ fontSize: 14, padding: "4px 8px", background: "var(--primary)", color: "white", border: "none", borderRadius: 4 }}
                  >
                    {expanded === group.session_id ? "Dölj" : "Visa"}
                  </button>
                  <button 
                    onClick={() => deleteSession(group.session_id)}
                    disabled={deleting}
                    style={{ 
                      fontSize: 14, 
                      padding: "4px 8px", 
                      background: "#dc2626", 
                      color: "white", 
                      border: "none", 
                      borderRadius: 4,
                      cursor: deleting ? "not-allowed" : "pointer"
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
              
              {expanded === group.session_id && (
                <div style={{ padding: 16 }}>
                  {/* Visa hela konversationen som en sammanhängande dialog */}
                  <div style={{ 
                    background: "#f8fafc", 
                    padding: 16, 
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    marginBottom: 16
                  }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Hela konversationen:</h4>
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {group.logs.flatMap((log, logIndex) => 
                        log.messages?.map((msg, msgIndex) => (
                          <div key={`${logIndex}-${msgIndex}`} style={{ 
                            marginBottom: 8,
                            padding: "8px 12px",
                            background: msg.role === "user" ? "#dbeafe" : "#f0f9ff",
                            borderRadius: 8,
                            borderLeft: `4px solid ${msg.role === "user" ? "var(--primary)" : "var(--secondary)"}`
                          }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 12, 
                              color: "#374151",
                              marginBottom: 4 
                            }}>
                              {msg.role === "user" ? "Användare" : "Grodan"} 
                              <span style={{ 
                                fontSize: 11, 
                                color: "#6b7280", 
                                marginLeft: 8,
                                fontWeight: "normal"
                              }}>
                                (meddelande {logIndex + 1})
                              </span>
                            </div>
                            <div 
                              style={{ fontSize: 14, lineHeight: 1.5 }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Visa individuella loggar för debugging */}
                  <details style={{ marginTop: 16 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                      Visa individuella loggar (debug)
                    </summary>
                    {group.logs.map((log, logIndex) => (
                      <div key={log.id} style={{ 
                        marginBottom: 16, 
                        padding: 12, 
                        background: "#f9fafb", 
                        borderRadius: 6,
                        border: "1px solid #e5e7eb"
                      }}>
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                          Logg {logIndex + 1} • {new Date(log.created_at).toLocaleString()} • Tokens: {log.total_tokens}
                        </div>
                        <div>
                          <b>Meddelanden i denna logg:</b>
                          <ul style={{ margin: "8px 0", padding: 0, listStyle: "none" }}>
                            {log.messages?.map((msg, idx) => (
                              <li key={idx} style={{ margin: "4px 0" }}>
                                <div style={{ marginBottom: "4px" }}>
                                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{msg.role === "user" ? "Användare" : "Grodan"}:</span>
                                </div>
                                <div 
                                  style={{ 
                                    fontSize: "13px", 
                                    lineHeight: "1.4",
                                    padding: "6px 8px",
                                    background: msg.role === "user" ? "#f0f9ff" : "#f8fafc",
                                    borderRadius: "4px",
                                    border: "1px solid #e2e8f0"
                                  }}
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                />
                              </li>
                            ))}
                          </ul>
                          <div style={{ marginTop: "8px" }}>
                            <b style={{ fontSize: "13px" }}>AI-svar:</b>
                            <div 
                              style={{ 
                                marginTop: "4px",
                                fontSize: "13px", 
                                lineHeight: "1.4",
                                padding: "6px 8px",
                                background: "#f0f9ff",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0"
                              }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(log.ai_response) }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 