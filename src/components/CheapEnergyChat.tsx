"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FormData {
  postnummer?: string;
  forbrukning?: string;
  personnummer?: string;
  addressConfirmed?: boolean;
  email?: string;
  telefon?: string;
  tilltradesdatum?: string;
  anlagningsId?: string;
  betalsatt?: string;
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: 'Hej! Låt oss hitta ett billigt elavtal åt dig. Skriv ditt postnummer så börjar vi!'
  }
];

export default function CheapEnergyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId] = useState<string>(() => 
    Date.now().toString(36) + Math.random().toString(36).substr(2)
  );
  const [formData, setFormData] = useState<FormData>({});
  const [currentStep, setCurrentStep] = useState<'postnummer' | 'forbrukning' | 'personnummer' | 'address_confirmation' | 'contact_details' | 'completed'>('postnummer');
  const [signingUrl, setSigningUrl] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Helper to call automation API
  const callAutomation = async (action: string, data: Record<string, any>) => {
    try {
      const res = await fetch('/api/cheap-energy-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action,
          data,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Något gick fel');
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  };

  // Helper to run multiple automation steps in sequence
  const runAutomationSteps = async (steps: Array<{ action: string; data: Record<string, any> }>) => {
    try {
      const res = await fetch('/api/cheap-energy-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          steps,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Något gick fel');
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  };

  // Parse user input for different steps
  const parseInput = (input: string, step: string): any => {
    const lowerInput = input.toLowerCase().trim();

    if (step === 'postnummer') {
      // Extract postnummer (5 digits, possibly with space)
      const match = input.match(/\d{3}\s?\d{2}/);
      return match ? match[0].replace(/\s/g, '') : null;
    }

    if (step === 'forbrukning') {
      // Map various inputs to forbrukning values
      if (lowerInput.includes('1') || lowerInput.includes('liten') || lowerInput.includes('2000')) {
        return '2000';
      }
      if (lowerInput.includes('2') || lowerInput.includes('normal') || lowerInput.includes('familj') || lowerInput.includes('5000')) {
        return '5000';
      }
      if (lowerInput.includes('3') || lowerInput.includes('stor') || lowerInput.includes('villa') || lowerInput.includes('elbil') || lowerInput.includes('20000')) {
        return '20000';
      }
      return null;
    }

    if (step === 'personnummer') {
      // Extract personnummer (YYYYMMDD-XXXX or YYYYMMDDXXXX)
      const match = input.match(/\d{8}[-]?\d{4}/);
      return match ? match[0].replace(/-/g, '') : null;
    }

    if (step === 'address_confirmation') {
      if (lowerInput.includes('ja') || lowerInput === 'j') {
        return true;
      }
      if (lowerInput.includes('nej') || lowerInput === 'n') {
        return false;
      }
      return null;
    }

    if (step === 'contact_details') {
      // Email
      if (input.includes('@')) {
        return { type: 'email', value: input.trim() };
      }
      // Phone (Swedish format)
      if (input.match(/^[\d\s\+\-\(\)]+$/)) {
        return { type: 'telefon', value: input.trim() };
      }
      // Date
      if (input.match(/\d{4}-\d{2}-\d{2}/) || input.toLowerCase().includes('snarast')) {
        return { type: 'tilltradesdatum', value: input.toLowerCase().includes('snarast') ? '' : input.trim() };
      }
      // Betalsätt
      if (lowerInput.includes('autogiro') || lowerInput.includes('kort') || lowerInput.includes('faktura')) {
        return { 
          type: 'betalsatt', 
          value: lowerInput.includes('autogiro') ? 'autogiro' : lowerInput.includes('kort') ? 'kort' : 'faktura' 
        };
      }
      // Anläggnings-ID
      if (input.match(/^\d+$/)) {
        return { type: 'anlagningsId', value: input.trim() };
      }
    }

    return null;
  };

  const handleStep = async (step: string, userInput: string) => {
    setLoading(true);
    setError('');

    try {
      if (step === 'postnummer') {
        const postnummer = parseInput(userInput, step);
        if (!postnummer) {
          setError('Skriv ditt postnummer (t.ex. 12345)');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, postnummer });
        const result = await callAutomation('fill_postnummer', { postnummer });
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Tack! Nu behöver jag veta din ungefärliga årsförbrukning. Välj ett av alternativen:\n\n1. 2000 kWh/år (liten lägenhet)\n2. 5000 kWh/år (normal familj)\n3. 20000 kWh/år (stor villa / elbil / hög förbrukning)` }
        ]);
        setCurrentStep('forbrukning');
      }

      else if (step === 'forbrukning') {
        const forbrukning = parseInput(userInput, step);
        if (!forbrukning) {
          setError('Välj alternativ 1, 2 eller 3');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, forbrukning });
        await callAutomation('fill_forbrukning', { forbrukning });
        
        // Automatically select rörligt timpris
        await callAutomation('select_contract_type', {});
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: 'Perfekt! Jag har valt rörligt timpris åt dig (det är det billigaste alternativet).\n\nNu behöver jag ditt personnummer (ÅÅÅÅMMDD-XXXX) så hämtar vi namn och adress automatiskt.' }
        ]);
        setCurrentStep('personnummer');
      }

      else if (step === 'personnummer') {
        const personnummer = parseInput(userInput, step);
        if (!personnummer || personnummer.length !== 12) {
          setError('Skriv ditt personnummer i formatet ÅÅÅÅMMDD-XXXX');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, personnummer });
        const result = await callAutomation('fill_personnummer', { personnummer });
        
        const addressInfo = result.addressData || {};
        const addressText = addressInfo.adress && addressInfo.ort 
          ? `${addressInfo.adress}, ${addressInfo.ort}`
          : 'din adress';

        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Tack! Jag har hämtat ${addressText}.\n\nStår du på ditt nuvarande elavtal på den här adressen? Svara Ja eller Nej.` }
        ]);
        setCurrentStep('address_confirmation');
      }

      else if (step === 'address_confirmation') {
        const confirmed = parseInput(userInput, step);
        if (confirmed === null) {
          setError('Svara Ja eller Nej');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, addressConfirmed: confirmed });
        await callAutomation('confirm_address', { confirmed });
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: 'Bra! Nu behöver jag några sista uppgifter:\n\n• Din e-postadress?' }
        ]);
        setCurrentStep('contact_details');
      }

      else if (step === 'contact_details') {
        const parsed = parseInput(userInput, step);
        
        if (!parsed) {
          setError('Skriv din e-postadress, telefonnummer, eller annan uppgift');
          setLoading(false);
          return;
        }

        const updatedFormData = { ...formData, [parsed.type]: parsed.value };
        setFormData(updatedFormData);

        // Check what's missing
        const missing: string[] = [];
        if (!updatedFormData.email) missing.push('e-postadress');
        if (!updatedFormData.telefon) missing.push('telefonnummer');
        if (!updatedFormData.tilltradesdatum) missing.push('tillträdesdatum');
        if (!updatedFormData.betalsatt) missing.push('betalsätt (autogiro/kort/faktura)');

        if (missing.length > 0) {
          const nextQuestion = missing[0];
          let questionText = '';
          if (nextQuestion === 'e-postadress') {
            questionText = 'Din e-postadress?';
          } else if (nextQuestion === 'telefonnummer') {
            questionText = 'Ditt telefonnummer?';
          } else if (nextQuestion === 'tillträdesdatum') {
            questionText = 'Tillträdesdatum? (t.ex. "snarast" eller ett specifikt datum)';
          } else if (nextQuestion.includes('betalsätt')) {
            questionText = 'Betalsätt? (autogiro, kort, eller faktura)';
          }

          setMessages(prev => [...prev, 
            { role: 'assistant', content: `Tack! ${questionText}` }
          ]);
        } else {
          // All data collected - run all automation steps in sequence
          setMessages(prev => [...prev, 
            { role: 'assistant', content: 'Perfekt! Jag fyller i alla uppgifter nu...' }
          ]);

          try {
            // Build steps array with all collected data
            const steps = [
              { action: 'fill_postnummer', data: { postnummer: updatedFormData.postnummer } },
              { action: 'fill_forbrukning', data: { forbrukning: updatedFormData.forbrukning } },
              { action: 'select_contract_type', data: {} },
              { action: 'fill_personnummer', data: { personnummer: updatedFormData.personnummer } },
              { action: 'confirm_address', data: { confirmed: updatedFormData.addressConfirmed } },
              { action: 'fill_contact_details', data: {
                email: updatedFormData.email,
                telefon: updatedFormData.telefon,
                tilltradesdatum: updatedFormData.tilltradesdatum || '',
                anlagningsId: updatedFormData.anlagningsId || '',
                betalsatt: updatedFormData.betalsatt,
              }},
              { action: 'submit_form', data: {} },
            ];

            const result = await runAutomationSteps(steps);
            
            if (result.results?.signingUrl) {
              setSigningUrl(result.results.signingUrl);
              setMessages(prev => [...prev, 
                { role: 'assistant', content: `Ditt avtal är nu klart att signera! Klicka här för att öppna BankID och godkänna:\n\n[${result.results.signingUrl}](${result.results.signingUrl})\n\nNär du signerat är du kund hos Cheap Energy – grattis!` }
              ]);
              setCurrentStep('completed');
            } else {
              setMessages(prev => [...prev, 
                { role: 'assistant', content: 'Formuläret är skickat! Du kommer få en bekräftelse via e-post.' }
              ]);
              setCurrentStep('completed');
            }
          } catch (submitError) {
            const errorMsg = submitError instanceof Error ? submitError.message : 'Något gick fel';
            setMessages(prev => [...prev, 
              { role: 'assistant', content: `Tyvärr gick något fel när formuläret skulle skickas: ${errorMsg}. Försök igen eller kontakta oss direkt.` }
            ]);
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Något gick fel';
      setError(errorMsg);
      setMessages(prev => [...prev, 
        { role: 'assistant', content: `Tyvärr gick något fel: ${errorMsg}. Försök igen eller kontakta oss direkt.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!input.trim() || loading || currentStep === 'completed') return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    await handleStep(currentStep, userMessage);
  };

  const clearChat = () => {
    setMessages(initialMessages);
    setInput('');
    setFormData({});
    setCurrentStep('postnummer');
    setSigningUrl(null);
    setError('');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 104,
          right: 24,
          zIndex: 1004,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: 56,
          height: 56,
          boxShadow: 'var(--glass-shadow-light)',
          fontSize: 28,
          cursor: 'pointer',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-label={open ? 'Stäng chat' : 'Öppna chat'}
      >
        ⚡
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 120,
            right: 24,
            width: 360,
            maxWidth: '98vw',
            height: 480,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 18,
            boxShadow: 'var(--glass-shadow-heavy)',
            zIndex: 1004,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            color: 'white', 
            padding: '1rem', 
            fontWeight: 700, 
            fontSize: 19, 
            letterSpacing: 0.2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span>⚡ Teckna Elavtal</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={clearChat}
                style={{ 
                  background: 'rgba(255,255,255,0.13)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  fontSize: 16, 
                  cursor: 'pointer', 
                  borderRadius: 6, 
                  padding: '2px 10px', 
                  marginRight: 2,
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  transition: 'all 0.2s ease'
                }}
                title="Rensa chatten"
                aria-label="Rensa chatten"
              >
                🗑
              </button>
              <button 
                onClick={() => setOpen(false)} 
                style={{ 
                  background: 'rgba(255,255,255,0.13)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  fontSize: 22, 
                  cursor: 'pointer',
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  transition: 'all 0.2s ease'
                }} 
                aria-label="Stäng"
              >
                ×
              </button>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: 'rgba(248, 250, 252, 0.8)' }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}>
                {msg.role === 'assistant' && <span style={{ fontSize: 22, marginRight: 6 }}>⚡</span>}
                <div style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255, 255, 255, 0.9)',
                  color: msg.role === 'user' ? 'white' : '#17416b',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '12px 16px',
                  maxWidth: 260,
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: 'var(--glass-shadow-light)',
                  wordBreak: 'break-word',
                  lineHeight: 1.7,
                  marginLeft: msg.role === 'user' ? 0 : 8,
                  marginRight: msg.role === 'user' ? 8 : 0,
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>
                    {msg.role === 'user' ? 'Du' : 'Elchef'}
                  </div>
                  <div dangerouslySetInnerHTML={{ 
                    __html: msg.content.replace(/\n/g, '<br/>').replace(
                      /\[([^\]]+)\]\(([^)]+)\)/g, 
                      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$1</a>'
                    )
                  }} />
                </div>
              </div>
            ))}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: 18,
              }}>
                <span style={{ fontSize: 22, marginRight: 6 }}>⚡</span>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#17416b',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  maxWidth: 260,
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: 'var(--glass-shadow-light)',
                  marginLeft: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>
                    Elchef
                  </div>
                  <div>Bearbetar...</div>
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: 'red', fontSize: 14, marginLeft: 8, marginTop: 8 }}>
                {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{ 
            display: 'flex', 
            borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: '0.5rem',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
          }}>
            <input
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={currentStep === 'completed' ? "Tack för ditt intresse!" : "Skriv ditt svar…"}
              style={{ 
                flex: 1, 
                border: '1px solid rgba(203, 213, 225, 0.5)', 
                borderRadius: 12, 
                padding: '0.8rem 1rem', 
                fontSize: 16, 
                outline: 'none', 
                background: currentStep === 'completed' ? 'rgba(243, 244, 246, 0.8)' : 'rgba(255, 255, 255, 0.9)', 
                marginRight: 8,
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
              }}
              disabled={loading || currentStep === 'completed'}
              maxLength={500}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim() || currentStep === 'completed'} 
              style={{ 
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                color: 'white', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                padding: '0 22px', 
                fontSize: 18, 
                cursor: 'pointer', 
                borderRadius: 12, 
                fontWeight: 700, 
                height: 44,
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
