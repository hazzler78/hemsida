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
  const isDev = process.env.NODE_ENV === 'development';

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Listen for custom event to open chat from GrokChat
  useEffect(() => {
    const handleOpenCheapEnergyChat = () => {
      setOpen(true);
    };
    
    window.addEventListener('openCheapEnergyChat', handleOpenCheapEnergyChat);
    
    return () => {
      window.removeEventListener('openCheapEnergyChat', handleOpenCheapEnergyChat);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Helper to call automation API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callAutomation = async (action: string, data: Record<string, unknown>) => {
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
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Något gick fel');
        } else {
          await res.text(); // Read response but don't use it
          throw new Error(`Serverfel: ${res.status} ${res.statusText}`);
        }
      }

      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await res.text(); // Read response but don't use it
        throw new Error('Fick inte JSON-svar från servern');
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  };

  // Helper to run multiple automation steps in sequence
  const runAutomationSteps = async (steps: Array<{ action: string; data: Record<string, unknown> }>) => {
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
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Något gick fel');
        } else {
          await res.text(); // Read response but don't use it
          throw new Error(`Serverfel: ${res.status} ${res.statusText}`);
        }
      }

      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await res.text(); // Read response but don't use it
        throw new Error('Fick inte JSON-svar från servern');
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  };

  // Parse user input for different steps
  const parseInput = (input: string, step: string, expectedField?: string): string | boolean | { type: string; value: string } | null => {
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
      // If we're expecting a specific field, prioritize that
      if (expectedField === 'email' && input.includes('@')) {
        return { type: 'email', value: input.trim() };
      }
      if (expectedField === 'telefon' && input.match(/^[\d\s\+\-\(\)]+$/)) {
        return { type: 'telefon', value: input.trim() };
      }
      if (expectedField === 'tilltradesdatum') {
        // Accept various date formats or "snarast"
        if (lowerInput.includes('snarast') || lowerInput.includes('snabbt') || lowerInput.includes('så snart')) {
          return { type: 'tilltradesdatum', value: '' };
        }
        // Try to parse various date formats
        const dateMatch = input.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/) || 
                         input.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/) ||
                         input.match(/(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+(\d{4})/i);
        if (dateMatch) {
          return { type: 'tilltradesdatum', value: input.trim() };
        }
        // If it looks like a date (contains numbers and separators), accept it
        if (input.match(/\d+[-\/\s]\d+/) && input.length < 20) {
          return { type: 'tilltradesdatum', value: input.trim() };
        }
        // Fallback: accept any reasonable input as date
        if (input.trim().length > 0 && input.trim().length < 50) {
          return { type: 'tilltradesdatum', value: input.trim() };
        }
      }
      if (expectedField === 'betalsatt') {
        // More flexible parsing for payment method - check exact matches first
        const trimmedInput = input.trim();
        const trimmedLower = trimmedInput.toLowerCase();
        
        // Exact matches (highest priority) - check both original and lowercase
        if (trimmedLower === 'faktura' || trimmedLower === 'invoice' || trimmedLower === '3' || 
            trimmedLower === 'fakturabetalning' || trimmedInput === 'faktura' || trimmedInput === 'Faktura') {
          return { type: 'betalsatt', value: 'faktura' };
        }
        if (trimmedLower === 'autogiro' || trimmedLower === 'auto-giro' || trimmedLower === '1' || 
            trimmedLower === 'autogirobetalning' || trimmedInput === 'autogiro' || trimmedInput === 'Autogiro') {
          return { type: 'betalsatt', value: 'autogiro' };
        }
        if (trimmedLower === 'kort' || trimmedLower === 'kreditkort' || trimmedLower === 'debitkort' || 
            trimmedLower === '2' || trimmedLower === 'kortbetalning' || trimmedInput === 'kort' || trimmedInput === 'Kort') {
          return { type: 'betalsatt', value: 'kort' };
        }
        
        // Contains matches (second priority) - check if input contains the keyword
        if (lowerInput.includes('faktura') || lowerInput.includes('invoice')) {
          return { type: 'betalsatt', value: 'faktura' };
        }
        if (lowerInput.includes('autogiro') || lowerInput.includes('auto-giro')) {
          return { type: 'betalsatt', value: 'autogiro' };
        }
        if (lowerInput.includes('kort') && !lowerInput.includes('autogiro')) {
          // Make sure "kort" doesn't match "autogiro"
          return { type: 'betalsatt', value: 'kort' };
        }
        if (lowerInput.includes('kreditkort') || lowerInput.includes('debitkort')) {
          return { type: 'betalsatt', value: 'kort' };
        }
        
        // Fallback: accept any reasonable input as payment method
        if (trimmedInput.length > 0 && trimmedInput.length < 50) {
          // Try to match the closest option using scoring
          const autogiroScore = (lowerInput.match(/auto|giro/g) || []).length;
          const kortScore = (lowerInput.match(/kort|card|kredit|debit/g) || []).length;
          const fakturaScore = (lowerInput.match(/faktura|invoice|bill/g) || []).length;
          
          // Prioritize faktura if it has any match
          if (fakturaScore > 0) {
            return { type: 'betalsatt', value: 'faktura' };
          }
          if (autogiroScore > 0 && autogiroScore >= kortScore) {
            return { type: 'betalsatt', value: 'autogiro' };
          }
          if (kortScore > 0) {
            return { type: 'betalsatt', value: 'kort' };
          }
          // If we have any input and we're expecting betalsatt, accept it as faktura (most common)
          return { type: 'betalsatt', value: 'faktura' };
        }
      }

      // General parsing (when no specific field expected)
      // Email
      if (input.includes('@')) {
        return { type: 'email', value: input.trim() };
      }
      // Phone (Swedish format) - but only if it's clearly a phone number
      if (input.match(/^[\d\s\+\-\(\)]+$/) && input.replace(/\D/g, '').length >= 7) {
        return { type: 'telefon', value: input.trim() };
      }
      // Date - improved parsing
      if (lowerInput.includes('snarast') || lowerInput.includes('snabbt') || lowerInput.includes('så snart')) {
        return { type: 'tilltradesdatum', value: '' };
      }
      // Try various date formats
      const dateMatch = input.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/) || 
                       input.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/) ||
                       input.match(/(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+(\d{4})/i);
      if (dateMatch) {
        return { type: 'tilltradesdatum', value: input.trim() };
      }
      // Betalsätt - improved parsing (for general parsing when no specific field expected)
      const trimmedLower = lowerInput.trim();
      
      // Exact matches first
      if (trimmedLower === 'faktura' || trimmedLower === 'invoice' || trimmedLower === '3') {
        return { type: 'betalsatt', value: 'faktura' };
      }
      if (trimmedLower === 'autogiro' || trimmedLower === 'auto-giro' || trimmedLower === '1') {
        return { type: 'betalsatt', value: 'autogiro' };
      }
      if (trimmedLower === 'kort' || trimmedLower === 'kreditkort' || trimmedLower === 'debitkort' || trimmedLower === '2') {
        return { type: 'betalsatt', value: 'kort' };
      }
      
      // Contains matches
      if (lowerInput.includes('faktura') || lowerInput.includes('invoice')) {
        return { type: 'betalsatt', value: 'faktura' };
      }
      if (lowerInput.includes('autogiro') || lowerInput.includes('auto-giro')) {
        return { type: 'betalsatt', value: 'autogiro' };
      }
      if (lowerInput.includes('kort') || lowerInput.includes('kreditkort') || lowerInput.includes('debitkort')) {
        return { type: 'betalsatt', value: 'kort' };
      }
      // Anläggnings-ID (only if it's clearly just digits)
      if (input.match(/^\d+$/) && input.length >= 4) {
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
        if (!postnummer || typeof postnummer !== 'string') {
          setError('Skriv ditt postnummer (t.ex. 12345)');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, postnummer });
        // Note: We don't call automation here - we collect all data first
        // Then run all steps in sequence at the end
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Tack! Nu behöver jag veta din ungefärliga årsförbrukning. Välj ett av alternativen:\n\n1. 2000 kWh/år (liten lägenhet)\n2. 5000 kWh/år (normal familj)\n3. 20000 kWh/år (stor villa / elbil / hög förbrukning)` }
        ]);
        setCurrentStep('forbrukning');
      }

      else if (step === 'forbrukning') {
        const forbrukning = parseInput(userInput, step);
        if (!forbrukning || typeof forbrukning !== 'string') {
          setError('Välj alternativ 1, 2 eller 3');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, forbrukning });
        // Note: We don't call automation here - we collect all data first
        // Contract type will be selected automatically in the final automation run
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: 'Perfekt! Jag kommer välja rörligt timpris åt dig (det är det billigaste alternativet).\n\nNu behöver jag ditt personnummer (ÅÅÅÅMMDD-XXXX) så hämtar vi namn och adress automatiskt.' }
        ]);
        setCurrentStep('personnummer');
      }

      else if (step === 'personnummer') {
        const personnummer = parseInput(userInput, step);
        if (!personnummer || typeof personnummer !== 'string' || personnummer.length !== 12) {
          setError('Skriv ditt personnummer i formatet ÅÅÅÅMMDD-XXXX');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, personnummer });
        // Note: We don't call automation here - we collect all data first
        // Address will be fetched automatically when we run the automation
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Tack! Jag kommer hämta din adress automatiskt när vi fyller i formuläret.\n\nStår du på ditt nuvarande elavtal på den här adressen? Svara Ja eller Nej.` }
        ]);
        setCurrentStep('address_confirmation');
      }

      else if (step === 'address_confirmation') {
        const confirmed = parseInput(userInput, step);
        if (confirmed === null || typeof confirmed !== 'boolean') {
          setError('Svara Ja eller Nej');
          setLoading(false);
          return;
        }

        setFormData({ ...formData, addressConfirmed: confirmed });
        // Note: We don't call automation here - we collect all data first
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: 'Bra! Nu behöver jag några sista uppgifter:\n\n• Din e-postadress?' }
        ]);
        setCurrentStep('contact_details');
      }

      else if (step === 'contact_details') {
        // Check what's missing to know what we're expecting
        const missing: string[] = [];
        if (!formData.email) missing.push('e-postadress');
        if (!formData.telefon) missing.push('telefonnummer');
        if (!formData.tilltradesdatum) missing.push('tillträdesdatum');
        if (!formData.betalsatt) missing.push('betalsätt');

        // Parse input with context of what we're expecting
        const expectedField = missing[0] === 'e-postadress' ? 'email' :
                             missing[0] === 'telefonnummer' ? 'telefon' :
                             missing[0] === 'tillträdesdatum' ? 'tilltradesdatum' :
                             missing[0] === 'betalsätt' ? 'betalsatt' : undefined;
        
        const parsed = parseInput(userInput, step, expectedField);
        
        if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || !('value' in parsed)) {
          // Give more specific error based on what we're expecting
          if (expectedField === 'email') {
            setError('Skriv din e-postadress (t.ex. namn@example.com)');
          } else if (expectedField === 'telefon') {
            setError('Skriv ditt telefonnummer (t.ex. 0701234567)');
          } else if (expectedField === 'tilltradesdatum') {
            setError('Skriv "snarast" eller ett datum (t.ex. 2026-03-01 eller 1 mars 2026)');
          } else if (expectedField === 'betalsatt') {
            setError('Välj betalsätt: autogiro, kort, eller faktura');
          } else {
            setError('Skriv din e-postadress, telefonnummer, eller annan uppgift');
          }
          setLoading(false);
          return;
        }

        // Type guard ensures parsed is { type: string; value: string }
        const contactData = parsed as { type: string; value: string };
        const updatedFormData = { ...formData, [contactData.type]: contactData.value };
        setFormData(updatedFormData);

        // Check what's still missing
        const stillMissing: string[] = [];
        if (!updatedFormData.email) stillMissing.push('e-postadress');
        if (!updatedFormData.telefon) stillMissing.push('telefonnummer');
        // Allow empty string for "snarast", but check if it's undefined/null
        if (updatedFormData.tilltradesdatum === undefined || updatedFormData.tilltradesdatum === null) {
          stillMissing.push('tillträdesdatum');
        }
        if (!updatedFormData.betalsatt) stillMissing.push('betalsätt');

        if (stillMissing.length > 0) {
          const nextQuestion = stillMissing[0];
          let questionText = '';
          if (nextQuestion === 'e-postadress') {
            questionText = 'Din e-postadress?';
          } else if (nextQuestion === 'telefonnummer') {
            questionText = 'Ditt telefonnummer?';
          } else if (nextQuestion === 'tillträdesdatum') {
            questionText = 'Tillträdesdatum? (t.ex. "snarast" eller ett specifikt datum som 2026-03-01)';
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
            
            const signingUrl = (result.results as { signingUrl?: string })?.signingUrl;
            if (signingUrl) {
              setMessages(prev => [...prev, 
                { role: 'assistant', content: `Ditt avtal är nu klart att signera! Klicka här för att öppna BankID och godkänna:\n\n[${signingUrl}](${signingUrl})\n\nNär du signerat är du kund hos Cheap Energy – grattis!` }
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
    setError('');
  };

  if (!isDev) {
    return null;
  }

  return (
    <>
      {/* Floating button - positioned to the left of GrokChat button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 104,
          right: 96, // Positioned to the left of GrokChat (24 + 56 + 16 margin)
          zIndex: 1003, // Slightly lower than GrokChat
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
