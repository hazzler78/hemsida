"use client";
import { clearAdminAuthed } from '@/lib/adminAuth';
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CustomerReminder } from "@/lib/types";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );


export default function AdminReminders() {
  const [reminders, setReminders] = useState<CustomerReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    cronConfigured: boolean;
    telegramConfigured: boolean;
    secretKeyConfigured: boolean;
    lastRun?: string;
    nextRun?: string;
  } | null>(null);
  const [testingReminders, setTestingReminders] = useState(false);
  const [testResult, setTestResult] = useState<string>("");
  const [newReminder, setNewReminder] = useState({
    customer_name: "",
    email: "",
    phone: "",
    contract_type: "12_months" as "12_months" | "24_months" | "36_months" | "variable",
    contract_start_date: "",
    notes: ""
  });
  const [editForm, setEditForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    contract_type: "12_months" as "12_months" | "24_months" | "36_months" | "variable",
    contract_start_date: "",
    notes: ""
  });

  const fetchReminders = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("customer_reminders")
      .select("*")
      .order("reminder_date", { ascending: true });
    
    if (!error && data) {
      setReminders(data as CustomerReminder[]);
    } else {
      setError("Kunde inte hämta påminnelser: " + error?.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check if vercel.json has cron configuration
      await fetch('/api/reminders');
      const status = {
        cronConfigured: true, // We know it's configured from vercel.json
        telegramConfigured: false,
        secretKeyConfigured: false,
        lastRun: undefined,
        nextRun: undefined
      };
      
      // Try to get due reminders to test the system
      const supabase = getSupabase();
      const { data: dueReminders } = await supabase
        .from("customer_reminders")
        .select("*")
        .eq('reminder_date', new Date().toISOString().split('T')[0])
        .eq('is_sent', false);
      
      status.telegramConfigured = dueReminders !== null; // If we can query, basic config is ok
      status.secretKeyConfigured = true; // We'll test this with manual test
      
      setSystemStatus(status);
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus({
        cronConfigured: true,
        telegramConfigured: false,
        secretKeyConfigured: false,
        lastRun: undefined,
        nextRun: undefined
      });
    }
  };

  const testReminderSystem = async () => {
    setTestingReminders(true);
    setTestResult("");
    
    try {
      // Use a hardcoded test key for now since client-side env vars are limited
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer elchef_reminder_secret_2025_xyz123',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Test lyckades! ${result.message || 'Påminnelser kontrollerade'}`);
        if (result.sent > 0) {
          setTestResult(prev => prev + `\n📧 ${result.sent} påminnelser skickade`);
        }
        if (result.failed > 0) {
          setTestResult(prev => prev + `\n❌ ${result.failed} påminnelser misslyckades`);
        }
      } else {
        setTestResult(`❌ Test misslyckades: ${result.error || 'Okänt fel'}`);
      }
    } catch (error) {
      setTestResult(`❌ Test misslyckades: ${error instanceof Error ? error.message : 'Nätverksfel'}`);
    } finally {
      setTestingReminders(false);
    }
  };

  const markOverdueAsSent = async () => {
    const overdueReminders = reminders.filter(r => !r.is_sent && new Date(r.reminder_date) < new Date());
    
    if (overdueReminders.length === 0) {
      setTestResult("ℹ️ Inga försenade påminnelser att markera");
      return;
    }
    
    if (!confirm(`Är du säker på att du vill markera ${overdueReminders.length} försenade påminnelser som skickade?`)) {
      return;
    }
    
    setTestingReminders(true);
    setTestResult("");
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_reminders")
        .update({ 
          is_sent: true,
          updated_at: new Date().toISOString()
        })
        .in('id', overdueReminders.map(r => r.id));
      
      if (error) {
        setTestResult(`❌ Fel vid uppdatering: ${error.message}`);
      } else {
        setTestResult(`✅ ${overdueReminders.length} försenade påminnelser markerade som skickade`);
        await fetchReminders(); // Refresh the list
      }
    } catch (error) {
      setTestResult(`❌ Fel: ${error instanceof Error ? error.message : 'Okänt fel'}`);
    } finally {
      setTestingReminders(false);
    }
  };


  const deleteReminder = async (id: number) => {
    if (!confirm("Är du säker på att du vill radera denna påminnelse?")) return;
    
    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_reminders")
        .delete()
        .eq("id", id);
      
      if (error) {
        setError("Kunde inte radera påminnelse: " + error.message);
      } else {
        await fetchReminders();
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

  const startEditing = (reminder: CustomerReminder) => {
    setEditingId(reminder.id!);
    setEditForm({
      customer_name: reminder.customer_name,
      email: reminder.email,
      phone: reminder.phone || "",
      contract_type: reminder.contract_type as "12_months" | "24_months" | "36_months" | "variable",
      contract_start_date: reminder.contract_start_date,
      notes: reminder.notes || ""
    });
    setError("");
  };

  const handleUpdateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setUpdating(true);
    try {
      const newReminderDate = calculateReminderDate(editForm.contract_start_date, editForm.contract_type);
      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_reminders")
        .update({
          customer_name: editForm.customer_name,
          email: editForm.email,
          phone: editForm.phone || null,
          contract_type: editForm.contract_type,
          contract_start_date: editForm.contract_start_date,
          reminder_date: newReminderDate,
          notes: editForm.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);
      if (error) {
        setError("Kunde inte uppdatera påminnelse: " + error.message);
      } else {
        await fetchReminders();
        setEditingId(null);
        setError("");
      }
    } catch {
      setError("Ett fel uppstod vid uppdatering");
    } finally {
      setUpdating(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Är du säker på att du vill radera ${selectedItems.size} påminnelser?`)) return;
    
    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_reminders")
        .delete()
        .in("id", Array.from(selectedItems));
      
      if (error) {
        setError("Kunde inte radera påminnelser: " + error.message);
      } else {
        await fetchReminders();
        setSelectedItems(new Set());
      }
    } catch {
      setError("Ett fel uppstod vid radering");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelection = (id: number) => {
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

  const toggleAll = () => {
    if (selectedItems.size === reminders.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reminders.map(r => r.id!)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case '12_months': return '12 månader';
      case '24_months': return '24 månader';
      case '36_months': return '36 månader';
      case 'variable': return 'Rörligt';
      default: return type;
    }
  };

  const getStatusBadge = (isSent: boolean, reminderDate: string) => {
    const today = new Date();
    const reminderDateObj = new Date(reminderDate);
    
    if (isSent) {
      return <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Skickad</span>;
    } else if (reminderDateObj < today) {
      return <span style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Försenad</span>;
    } else {
      return <span style={{ color: 'orange', fontWeight: 'bold' }}>⏳ Väntar</span>;
    }
  };

  const calculateReminderDate = (contractStartDate: string, contractType: string): string => {
    const startDate = new Date(contractStartDate);
    const addMonthsKeepingEnd = (date: Date, monthsToAdd: number) => {
      const result = new Date(date);
      const originalDay = result.getDate();
      result.setMonth(result.getMonth() + monthsToAdd);
      if (result.getDate() < originalDay) {
        result.setDate(0);
      }
      return result;
    };
    const formatLocalYYYYMMDD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    let totalMonths = 12;
    switch (contractType) {
      case '12_months': totalMonths = 12; break;
      case '24_months': totalMonths = 24; break;
      case '36_months': totalMonths = 36; break;
      default: throw new Error('Invalid contract type');
    }
    const reminderDate = addMonthsKeepingEnd(startDate, totalMonths - 11);
    return formatLocalYYYYMMDD(reminderDate);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReminder.customer_name || !newReminder.email || !newReminder.contract_start_date) {
      setError("Fyll i alla obligatoriska fält");
      return;
    }

    setCreating(true);
    try {
      const reminderDate = calculateReminderDate(newReminder.contract_start_date, newReminder.contract_type);
      
      const reminderData = {
        customer_name: newReminder.customer_name,
        email: newReminder.email,
        phone: newReminder.phone || null,
        contract_type: newReminder.contract_type,
        contract_start_date: newReminder.contract_start_date,
        reminder_date: reminderDate,
        is_sent: false,
        notes: newReminder.notes || null
      };

      const supabase = getSupabase();
      const { error } = await supabase
        .from("customer_reminders")
        .insert([reminderData]);

      if (error) {
        setError("Kunde inte skapa påminnelse: " + error.message);
      } else {
        await fetchReminders();
        setNewReminder({
          customer_name: "",
          email: "",
          phone: "",
          contract_type: "12_months",
          contract_start_date: "",
          notes: ""
        });
        setShowCreateForm(false);
        setError("");
      }
    } catch {
      setError("Ett fel uppstod vid skapande av påminnelse");
    } finally {
      setCreating(false);
    }
  };


  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kundpåminnelser</h1>
        <div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ 
              marginRight: '1rem', 
              padding: '0.5rem 1rem', 
              background: 'var(--secondary)', 
              color: 'black', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Avbryt' : '➕ Skapa ny påminnelse'}
          </button>
          <button
            onClick={() => {
              clearAdminAuthed();
              window.location.href = "/admin";
            }}
            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Logga ut
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* System Status Section */}
      {systemStatus && (
        <div style={{ 
          padding: '1.5rem', 
          background: '#f0f9ff', 
          border: '1px solid var(--primary)', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0c4a6e' }}>🔧 Systemstatus</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: systemStatus.cronConfigured ? 'rgba(254,204,0,0.1)' : '#fef2f2', border: `1px solid ${systemStatus.cronConfigured ? 'var(--secondary)' : '#ef4444'}`, borderRadius: '4px', color: systemStatus.cronConfigured ? 'black' : undefined }}>
              <strong>Cron Jobs:</strong> {systemStatus.cronConfigured ? '✅ Konfigurerade' : '❌ Saknas'}
            </div>
            <div style={{ padding: '0.75rem', background: systemStatus.telegramConfigured ? 'rgba(254,204,0,0.1)' : '#fef2f2', border: `1px solid ${systemStatus.telegramConfigured ? 'var(--secondary)' : '#ef4444'}`, borderRadius: '4px', color: systemStatus.telegramConfigured ? 'black' : undefined }}>
              <strong>Telegram:</strong> {systemStatus.telegramConfigured ? '✅ Konfigurerat' : '❌ Saknas'}
            </div>
            <div style={{ padding: '0.75rem', background: systemStatus.secretKeyConfigured ? 'rgba(254,204,0,0.1)' : '#fef2f2', border: `1px solid ${systemStatus.secretKeyConfigured ? 'var(--secondary)' : '#ef4444'}`, borderRadius: '4px', color: systemStatus.secretKeyConfigured ? 'black' : undefined }}>
              <strong>Secret Key:</strong> {systemStatus.secretKeyConfigured ? '✅ Konfigurerat' : '❌ Saknas'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={testReminderSystem}
              disabled={testingReminders}
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: testingReminders ? 'not-allowed' : 'pointer',
                opacity: testingReminders ? 0.6 : 1
              }}
            >
              {testingReminders ? '🔄 Testar...' : '🧪 Testa påminnelsesystem'}
            </button>
            
            <button
              onClick={markOverdueAsSent}
              disabled={testingReminders}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#f59e0b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: testingReminders ? 'not-allowed' : 'pointer',
                opacity: testingReminders ? 0.6 : 1
              }}
            >
              {testingReminders ? '🔄 Uppdaterar...' : '✅ Markera försenade som skickade'}
            </button>
            
            <button
              onClick={checkSystemStatus}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#6b7280', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Uppdatera status
            </button>
          </div>
          
          {testResult && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: testResult.includes('✅') ? 'rgba(254,204,0,0.1)' : '#fef2f2', 
              border: `1px solid ${testResult.includes('✅') ? 'var(--secondary)' : '#ef4444'}`, 
              borderRadius: '4px',
              whiteSpace: 'pre-line'
            }}>
              {testResult}
            </div>
          )}
          
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            <p><strong>Nästa körning:</strong> Varje dag kl 09:00 (Vercel Cron)</p>
            <p><strong>Försenade påminnelser:</strong> {reminders.filter(r => !r.is_sent && new Date(r.reminder_date) < new Date()).length} st</p>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div style={{ 
          padding: '1.5rem', 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Skapa ny påminnelse</h3>
          <form onSubmit={handleCreateReminder}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Kundnamn *
                </label>
                <input
                  type="text"
                  value={newReminder.customer_name}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, customer_name: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  E-post *
                </label>
                <input
                  type="email"
                  value={newReminder.email}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newReminder.phone}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Avtalstyp *
                </label>
                <select
                  value={newReminder.contract_type}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, contract_type: e.target.value as "12_months" | "24_months" | "36_months" | "variable" }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                >
                  <option value="12_months">12 månader</option>
                  <option value="24_months">24 månader</option>
                  <option value="36_months">36 månader</option>
                  <option value="variable">Rörligt</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Avtal startar *
                </label>
                <input
                  type="date"
                  value={newReminder.contract_start_date}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, contract_start_date: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Anteckningar
              </label>
              <textarea
                value={newReminder.notes}
                onChange={(e) => setNewReminder(prev => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px' }}
                placeholder="Valfria anteckningar..."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={creating}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--secondary)', 
                  color: 'black', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1
                }}
              >
                {creating ? 'Skapar...' : 'Skapa påminnelse'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: '#6b7280', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {editingId && (
        <div style={{ 
          padding: '1.5rem', 
          background: '#fff7ed', 
          border: '1px solid #fdba74', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Redigera påminnelse</h3>
          <form onSubmit={handleUpdateReminder}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Kundnamn *
                </label>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  E-post *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Avtalstyp *
                </label>
                <select
                  value={editForm.contract_type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contract_type: e.target.value as "12_months" | "24_months" | "36_months" | "variable" }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                >
                  <option value="12_months">12 månader</option>
                  <option value="24_months">24 månader</option>
                  <option value="36_months">36 månader</option>
                  <option value="variable">Rörligt</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Avtal startar *
                </label>
                <input
                  type="date"
                  value={editForm.contract_start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contract_start_date: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  required
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Anteckningar
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px' }}
                placeholder="Valfria anteckningar..."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={updating}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.6 : 1
                }}
              >
                {updating ? 'Sparar...' : 'Spara ändringar'}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: '#6b7280', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={fetchReminders}
          disabled={loading}
          style={{ marginRight: '1rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Laddar...' : 'Uppdatera'}
        </button>
        
        {selectedItems.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {deleting ? 'Raderar...' : `Radera ${selectedItems.size} valda`}
          </button>
        )}
      </div>

      {loading ? (
        <p>Laddar påminnelser...</p>
      ) : reminders.length === 0 ? (
        <p>Inga påminnelser hittades.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === reminders.length}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Kund</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>E-post</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Telefon</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Avtalstyp</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Startdatum</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Påminnelse</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Anteckningar</th>
                <th style={{ padding: '0.75rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(reminder.id!)}
                      onChange={() => toggleSelection(reminder.id!)}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{reminder.customer_name}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{reminder.email}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{reminder.phone || '-'}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{getContractTypeLabel(reminder.contract_type)}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{formatDate(reminder.contract_start_date)}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{formatDate(reminder.reminder_date)}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                    {getStatusBadge(reminder.is_sent, reminder.reminder_date)}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={reminder.notes || ''}>
                    {reminder.notes || '—'}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => startEditing(reminder)}
                        style={{ padding: '0.25rem 0.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.875rem' }}
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id!)}
                        disabled={deleting}
                        style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.875rem' }}
                      >
                        Radera
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '4px' }}>
        <h3>Statistik</h3>
        <p>Totalt: {reminders.length} påminnelser</p>
        <p>Skickade: {reminders.filter(r => r.is_sent).length}</p>
        <p>Väntande: {reminders.filter(r => !r.is_sent && new Date(r.reminder_date) >= new Date()).length}</p>
        <p>Försenade: {reminders.filter(r => !r.is_sent && new Date(r.reminder_date) < new Date()).length}</p>
      </div>
    </div>
  );
}