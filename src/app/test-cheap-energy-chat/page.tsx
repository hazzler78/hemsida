'use client';

import CheapEnergyChat from '@/components/CheapEnergyChat';

export default function TestCheapEnergyChat() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1rem',
          color: '#1a202c'
        }}>
          Testa Cheap Energy Chat
        </h1>
        <p style={{ 
          color: '#4a5568', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Denna sida låter dig testa Cheap Energy automation-chatten lokalt.
          Chatten kommer att automatiskt fylla i formuläret på Cheap Energy's sida
          medan du chattar med AI:n.
        </p>
        
        <div style={{
          background: '#f7fafc',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#2d3748' }}>
            Instruktioner:
          </h2>
          <ol style={{ 
            paddingLeft: '1.5rem', 
            color: '#4a5568',
            lineHeight: '1.8'
          }}>
            <li>Klicka på chat-ikonen längst ner till höger</li>
            <li>Följ instruktionerna i chatten</li>
            <li>Ge ditt postnummer när du blir ombedd</li>
            <li>Välj årsförbrukning (1, 2 eller 3)</li>
            <li>Fyll i personnummer (testdata: 199001011234)</li>
            <li>Svara på adressbekräftelse (Ja/Nej)</li>
            <li>Fyll i kontaktuppgifter</li>
            <li>Chatten kommer automatiskt fylla i formuläret i bakgrunden</li>
          </ol>
        </div>

        <div style={{
          background: '#fff5f5',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #fed7d7',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#c53030', margin: 0 }}>
            <strong>OBS:</strong> Detta fungerar bara lokalt (Node.js runtime). 
            På Cloudflare Pages kommer automationen inte fungera eftersom Playwright 
            kräver Node.js runtime.
          </p>
        </div>

        <div style={{
          background: '#f0fff4',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #9ae6b4'
        }}>
          <p style={{ color: '#22543d', margin: 0 }}>
            <strong>Tips:</strong> Kontrollera loggarna i Supabase tabellen 
            <code style={{ 
              background: '#c6f6d5', 
              padding: '0.2rem 0.4rem', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>cheap_energy_automation_logs</code> för att se vad som händer i bakgrunden.
          </p>
        </div>
      </div>

      {/* CheapEnergyChat komponenten renderas här */}
      <CheapEnergyChat />
    </div>
  );
}
