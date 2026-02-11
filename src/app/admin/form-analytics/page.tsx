"use client";
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const getSupabase = () => createClient(supabaseUrl as string, supabaseKey as string);

const ADMIN_PASSWORD = "grodan2025";

type ContactSubmission = {
  id: number;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  ref: string | null;
  campaign_code: string | null;
  subscribe_newsletter: boolean;
  form_type?: string;
};

type FormAnalytics = {
  totalSubmissions: number;
  submissionsByDay: { date: string; count: number }[];
  submissionsByForm: { form: string; count: number }[];
  submissionsByRef: { ref: string; count: number }[];
  submissionsByCampaign: { campaign: string; count: number }[];
  newsletterSubscriptions: number;
  conversionRate: number;
};

export default function AdminFormAnalytics() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('admin_authed') === 'true') setAuthed(true);
    }
  }, []);

  const calculateAnalytics = useCallback((data: ContactSubmission[]) => {
    const filtered = data.filter(contact => {
      if (!dateFrom && !dateTo) return true;
      const contactDate = new Date(contact.created_at).getTime();
      const fromOk = !dateFrom || contactDate >= new Date(dateFrom).getTime();
      const toOk = !dateTo || contactDate <= new Date(dateTo).getTime() + 24*60*60*1000 - 1;
      return fromOk && toOk;
    });

    // Group by day
    const byDay = filtered.reduce((acc, contact) => {
      const date = contact.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const submissionsByDay = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by form type (using form_type field or fallback to ref/campaign)
    const byForm = filtered.reduce((acc, contact) => {
      let form = 'Kontaktformulär';
      
      if (contact.form_type) {
        switch (contact.form_type) {
          case 'chat': form = 'Chat-kontakt'; break;
          case 'newsletter': form = 'Nyhetsbrev'; break;
          case 'affiliate': form = 'Affiliate'; break;
          case 'partner': form = 'Partner'; break;
          case 'sol_laddbox': form = 'Sol/Laddbox'; break;
          default: form = contact.form_type.charAt(0).toUpperCase() + contact.form_type.slice(1);
        }
      } else {
        // Fallback to old logic
        if (contact.ref?.includes('chat')) form = 'Chat-kontakt';
        if (contact.ref?.includes('newsletter')) form = 'Nyhetsbrev';
        if (contact.ref?.includes('affiliate')) form = 'Affiliate';
        if (contact.ref?.includes('partner')) form = 'Partner';
      }
      
      if (contact.campaign_code) form = `Kampanj: ${contact.campaign_code}`;
      
      acc[form] = (acc[form] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const submissionsByForm = Object.entries(byForm)
      .map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count);

    // Group by ref
    const byRef = filtered.reduce((acc, contact) => {
      const ref = contact.ref || 'Ingen referens';
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const submissionsByRef = Object.entries(byRef)
      .map(([ref, count]) => ({ ref, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Group by campaign
    const byCampaign = filtered.reduce((acc, contact) => {
      const campaign = contact.campaign_code || 'Ingen kampanj';
      acc[campaign] = (acc[campaign] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const submissionsByCampaign = Object.entries(byCampaign)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    const newsletterSubscriptions = filtered.filter(c => c.subscribe_newsletter).length;
    const totalSubmissions = filtered.length;
    const conversionRate = totalSubmissions > 0 ? (newsletterSubscriptions / totalSubmissions) * 100 : 0;

    setAnalytics({
      totalSubmissions,
      submissionsByDay,
      submissionsByForm,
      submissionsByRef,
      submissionsByCampaign,
      newsletterSubscriptions,
      conversionRate
    });
  }, [dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(''); // Rensa tidigare fel
    try {
      console.log('Försöker hämta data från Supabase...');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key:', supabaseKey ? 'Finns' : 'Saknas');
      
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        setError(`Databasfel: ${error.message}`);
        return;
      }

      console.log('Data hämtad:', data?.length || 0, 'kontakter');
      setContacts(data as ContactSubmission[]);
      calculateAnalytics(data as ContactSubmission[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Ett fel uppstod: ${err instanceof Error ? err.message : 'Okänt fel'}`);
    } finally {
      setLoading(false);
    }
  }, [calculateAnalytics]);

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [authed, fetchData]);

  useEffect(() => {
    if (contacts.length > 0) {
      calculateAnalytics(contacts);
    }
  }, [dateFrom, dateTo, calculateAnalytics, contacts]);

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

  function quickRange(days: number) {
    const to = new Date();
    const from = new Date(Date.now() - days*24*60*60*1000);
    setDateFrom(from.toISOString().slice(0,10));
    setDateTo(to.toISOString().slice(0,10));
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
  }

  async function testDatabaseConnection() {
    try {
      console.log('Testar Supabase-anslutning...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseKey ? 'Finns' : 'Saknas');
      
      // Testa att hämta en enkel fråga
      const supabase = getSupabase();
      const { error } = await supabase
        .from('contacts')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Databasfel vid test:', error);
        setError(`Databasfel vid test: ${error.message}`);
      } else {
        console.log('Databasanslutning fungerar!');
        setError('');
        // Hämta data igen
        fetchData();
      }
    } catch (err) {
      console.error('Fel vid test av databasanslutning:', err);
      setError(`Fel vid test: ${err instanceof Error ? err.message : 'Okänt fel'}`);
    }
  }

  function exportCsv() {
    if (contacts.length === 0) return;
    
    const headers = ['Datum', 'Namn', 'E-post', 'Telefon', 'Meddelande', 'Referens', 'Kampanj', 'Nyhetsbrev'];
    const csv = [headers.join(',')]
      .concat(contacts.map(c => [
        c.created_at,
        c.name || '',
        c.email,
        c.phone || '',
        (c.message || '').replace(/"/g, '""'),
        c.ref || '',
        c.campaign_code || '',
        c.subscribe_newsletter ? 'Ja' : 'Nej'
      ].map(val => `"${val}"`).join(',')))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form_submissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h2>Admininloggning</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Lösenord"
            style={{ width: '100%', padding: 10, fontSize: 16, marginBottom: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            autoFocus
          />
          <button type="submit" style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600 }}>
            Logga in
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <h1>Formulärstatistik</h1>
      <p style={{ color: '#64748b', marginTop: 4, marginBottom: 12 }}>
        Statistik över alla formulärinlämningar på hemsidan
      </p>

      {/* Filters and Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <button onClick={fetchData} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Uppdatera</button>
        <button onClick={() => quickRange(1)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>24h</button>
        <button onClick={() => quickRange(7)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>7d</button>
        <button onClick={() => quickRange(30)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>30d</button>
        <button onClick={clearFilters} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Rensa</button>
        <button onClick={exportCsv} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>Export CSV</button>
        <button onClick={testDatabaseConnection} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f3f4f6' }}>Testa anslutning</button>
      </div>

      {loading && <p>Laddar...</p>}

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px' 
        }}>
          <strong>Fel:</strong> {error}
        </div>
      )}

      {!loading && !error && contacts.length === 0 && (
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          color: '#0369a1', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px' 
        }}>
          <strong>Ingen data:</strong> Det finns inga kontakter i databasen ännu.
        </div>
      )}

      {!loading && analytics && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem' }}>Totalt antal</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{analytics.totalSubmissions}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem' }}>Nyhetsbrev</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{analytics.newsletterSubscriptions}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem' }}>Konvertering</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{analytics.conversionRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Form Types */}
          <div style={{ marginBottom: 24 }}>
            <h2>Formulärtyper</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Formulär</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Antal</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Procent</th>
                </tr>
              </thead>
              <tbody>
                {analytics.submissionsByForm.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.form}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.count}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>
                      {((item.count / analytics.totalSubmissions) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daily Trend */}
          {analytics.submissionsByDay.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2>Daglig trend</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Datum</th>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Antal</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.submissionsByDay.slice(-14).map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.date}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Referrals */}
          {analytics.submissionsByRef.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2>Topp 10 referenser</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Referens</th>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Antal</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.submissionsByRef.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.ref}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Campaigns */}
          {analytics.submissionsByCampaign.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2>Topp 10 kampanjer</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Kampanj</th>
                    <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>Antal</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.submissionsByCampaign.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{item.campaign}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent Submissions */}
          <div>
            <h2>Senaste inlämningar</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Datum</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Namn</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>E-post</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Telefon</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'left' }}>Referens</th>
                  <th style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>Nyhetsbrev</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, 20).map((contact, index) => (
                  <tr key={index}>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                      {new Date(contact.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{contact.name || '-'}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{contact.email}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{contact.phone || '-'}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{contact.ref || '-'}</td>
                    <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {contact.subscribe_newsletter ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
