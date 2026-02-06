'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import GlassButton from '@/components/GlassButton';
import ContactForm from '@/components/ContactForm';
import ShareResults from '@/components/ShareResults';
import { withDefaultCtaUtm } from '@/lib/utm';

// SVG Ikoner i glassmorphism-stil
const AnalysisIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, filter: 'drop-shadow(0 2px 4px rgba(0,106,167,0.2))' }}>
    <ellipse cx="12" cy="21" rx="6" ry="2" fill="rgba(0,106,167,0.18)" />
    <path d="M12 3c2.5 0 5 2.5 5 5 0 3-3 7-5 10C10 15 7 11 7 8c0-2.5 2.5-5 5-5z" fill="url(#analysis-gradient)" stroke="rgba(0,106,167,0.6)" strokeWidth="1.2" />
    <circle cx="12" cy="8" r="2" fill="#fff" stroke="rgba(0,106,167,0.7)" strokeWidth="1" />
    <defs>
      <linearGradient id="analysis-gradient" x1="7" y1="3" x2="17" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006aa7" />
        <stop offset="1" stopColor="#fecc00" />
      </linearGradient>
    </defs>
  </svg>
);

const SavingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, filter: 'drop-shadow(0 2px 4px rgba(0,106,167,0.18))' }}>
    <ellipse cx="12" cy="21" rx="6" ry="2" fill="rgba(0,106,167,0.13)" />
    <ellipse cx="12" cy="12" rx="6" ry="4.5" fill="url(#savings-gradient)" stroke="#006aa7" strokeWidth="1" />
    <circle cx="10" cy="11" r="0.8" fill="#fff" />
    <rect x="14" y="14" width="2" height="3" rx="1" fill="#1693FF" />
    <defs>
      <linearGradient id="savings-gradient" x1="6" y1="7.5" x2="18" y2="16.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006aa7" />
        <stop offset="1" stopColor="#fecc00" />
      </linearGradient>
    </defs>
  </svg>
);

const ConclusionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, filter: 'drop-shadow(0 2px 4px rgba(0,106,167,0.2))' }}>
    <ellipse cx="12" cy="21" rx="6" ry="2" fill="rgba(0,106,167,0.13)" />
    <circle cx="12" cy="12" r="6" fill="url(#conclusion-gradient)" stroke="#006aa7" strokeWidth="1.2" />
    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="conclusion-gradient" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006aa7" />
        <stop offset="1" stopColor="#fecc00" />
      </linearGradient>
    </defs>
  </svg>
);

const RecommendationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, filter: 'drop-shadow(0 2px 4px rgba(0,106,167,0.2))' }}>
    <ellipse cx="12" cy="21" rx="6" ry="2" fill="rgba(0,106,167,0.18)" />
    <path d="M12 3c-1.5 0-3 1.5-3 3v6c0 1.5 1.5 3 3 3s3-1.5 3-3V6c0-1.5-1.5-3-3-3z" fill="url(#recommendation-gradient)" stroke="rgba(0,106,167,0.6)" strokeWidth="1.2" />
    <circle cx="12" cy="8" r="1.5" fill="#fff" stroke="rgba(0,106,167,0.7)" strokeWidth="1" />
    <defs>
      <linearGradient id="recommendation-gradient" x1="9" y1="3" x2="15" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006aa7" />
        <stop offset="1" stopColor="#fecc00" />
      </linearGradient>
    </defs>
  </svg>
);

const ButtonWrapper = ({ children }: { children: React.ReactNode }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (wrapperRef.current) {
      const button = wrapperRef.current.querySelector('button') as HTMLElement;
      if (button) {
        button.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3), var(--glass-shadow-light)';
      }
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        cursor: 'pointer',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        const button = e.currentTarget.querySelector('button') as HTMLElement;
        if (button) {
          button.style.transform = 'translateY(-2px) scale(1.02)';
          button.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4), var(--glass-shadow-medium)';
          button.style.background = 'linear-gradient(135deg, #059669, #047857)';
        }
      }}
      onMouseLeave={(e) => {
        const button = e.currentTarget.querySelector('button') as HTMLElement;
        if (button) {
          button.style.transform = 'translateY(0) scale(1)';
          button.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3), var(--glass-shadow-light)';
          button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default function JamforElpriser() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gptResult, setGptResult] = useState<string | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logId, setLogId] = useState<number | null>(null);
  const sessionIdRef = useRef<string>('');
  const [consentToStore, setConsentToStore] = useState(false);

  useEffect(() => {
    try {
      const existing = typeof window !== 'undefined' ? localStorage.getItem('invoiceSessionId') : null;
      if (existing) {
        sessionIdRef.current = existing;
      } else {
        const generated = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
        sessionIdRef.current = generated;
        if (typeof window !== 'undefined') localStorage.setItem('invoiceSessionId', generated);
      }
    } catch {}
  }, []);

  // Spåra sidvisning med UTM-parametrar
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const sid = sessionIdRef.current || localStorage.getItem('invoiceSessionId') || '';
      
      // Hämta UTM-parametrar från URL
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source') || undefined;
      const utmMedium = params.get('utm_medium') || undefined;
      const utmCampaign = params.get('utm_campaign') || undefined;
      const landingReferrer = typeof document.referrer === 'string' ? document.referrer : '';
      const payload = JSON.stringify({ 
        path: '/jamfor-elpriser', 
        sessionId: sid,
        utmSource,
        utmMedium,
        utmCampaign,
        referrer: landingReferrer
      });
      const url = '/api/events/page-view';
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
    } catch {}
  }, []);

  // Funktion för att spåra kontraktsklick från AI-användare
  const trackContractClick = (contractType: 'rorligt' | 'fastpris') => {
    try {
      // Extrahera besparingsbelopp från AI-analysen
      const extractSavings = (text: string): number => {
        // Försök olika format som används i GPT-svaret
        const patterns = [
          /spara totalt\s*(\d+(?:[,.]\d+)?)/i,  // "spara totalt 150"
          /spara\s*(\d+(?:[,.]\d+)?)\s*kr\/år/i,  // "spara 150 kr/år"
          /(\d+(?:[,.]\d+)?)\s*kr.*?(?:spar|bespar|minska)/i,  // ursprunglig pattern
          /Din årliga besparing:\s*(\d+(?:[,.]\d+)?)/i,  // "Din årliga besparing: 150"
          /Total besparing:\s*(\d+(?:[,.]\d+)?)/i  // "Total besparing: 150"
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            const amount = parseFloat(match[1].replace(',', '.'));
            if (amount > 0) {
              return amount;
            }
          }
        }
        
        return 0;
      };

      const savingsAmount = gptResult ? extractSavings(gptResult) : 0;
      
      // Debug: Logga extraktionsresultat
      console.log('GPT Result:', gptResult);
      console.log('Extracted savings amount:', savingsAmount);
      
      const payload = JSON.stringify({
        contractType,
        logId,
        savingsAmount,
        sessionId: sessionIdRef.current,
        source: 'jamfor-elpriser',
        utmSource: 'jamfor',
        utmMedium: 'cta',
        utmCampaign: `cta-${contractType}`
      });

      // Använd sendBeacon för bättre tillförlitlighet
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/events/contract-click', blob);
      } else {
        fetch('/api/events/contract-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error tracking contract click:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setGptResult(null);
      setShowFullAnalysis(false);
    }
  };

  async function handleGptOcr() {
    if (!file) return;
    setLoading(true);
    setError('');
    setGptResult(null);
    setShowFullAnalysis(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('consent', String(consentToStore));
      const res = await fetch('/api/gpt-ocr', {
        method: 'POST',
        body: formData,
        headers: {
          'x-session-id': sessionIdRef.current || '',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.gptAnswer) {
        throw new Error('Inget svar från AI:n');
      }
      setLogId(typeof data.logId === 'number' ? data.logId : null);
      
      // Kontrollera om AI:n returnerade ett felmeddelande
      if (data.gptAnswer.includes("I'm sorry") || data.gptAnswer.includes("can't assist") || 
          data.gptAnswer.includes("Tyvärr") || data.gptAnswer.includes("kan inte") ||
          data.gptAnswer.includes("Jag kan inte") || data.gptAnswer.includes("kan inte hjälpa")) {
        throw new Error('AI:n kunde inte analysera fakturan. Kontrollera att bilden är tydlig och innehåller en elräkning. Prova att ladda upp bilden igen - det fungerar ofta på andra försöket!');
      }
      
      // Rensa bort matematiska formler från svaret
      let cleanedResult = data.gptAnswer;
      
      // Ta bort formler som ( \frac{...}{...} = ... )
      cleanedResult = cleanedResult.replace(/\( \\frac\{[^}]+\}\{[^}]+\} = [^)]+ \)/g, '');
      
      // Ta bort formler som ( ... + ... = ... )
      cleanedResult = cleanedResult.replace(/\( [^)]*\+[^)]* = [^)]* \)/g, '');
      
      // Ta bort formler som ( ... × ... = ... )
      cleanedResult = cleanedResult.replace(/\( [^)]*×[^)]* = [^)]* \)/g, '');
      
      // Ta bort tomma rader som kan ha skapats
      cleanedResult = cleanedResult.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      setGptResult(cleanedResult);
    } catch (error) {
      console.error('Error analyzing invoice:', error);
      setError(`Kunde inte analysera fakturan: ${error instanceof Error ? error.message : 'Okänt fel'}. Prova att ladda upp bilden igen - det fungerar ofta på andra försöket!`);
    } finally {
      setLoading(false);
    }
  }


  function handleUploadNew() {
    setFile(null);
    setGptResult(null);
    setError('');
    setShowFullAnalysis(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Funktion för att extrahera endast slutsatsen och nedåt
  function getSummarySection(text: string) {
    if (!text) return '';
    
    const lines = text.split('\n');
    const startIndex = lines.findIndex(line => line.includes('Slutsats'));
    
    if (startIndex === -1) {
      // Om ingen slutsats hittas, visa allt
      return text;
    }
    
    return lines.slice(startIndex).join('\n');
  }

  // Funktion för att extrahera allt före slutsatsen
  function getDetailedSection(text: string) {
    if (!text) return '';
    
    const lines = text.split('\n');
    const startIndex = lines.findIndex(line => line.includes('Slutsats'));
    
    if (startIndex === -1) {
      // Om ingen slutsats hittas, returnera tomt
      return '';
    }
    
    return lines.slice(0, startIndex).join('\n');
  }

  // Funktion för att kontrollera om texten innehåller en slutsats
  function hasSummarySection(text: string) {
    if (!text) return false;
    return text.includes('Slutsats');
  }

  // Funktion för att validera beräkningar
  function validateCalculations(text: string) {
    if (!text) return { isValid: true, warnings: [] };
    
    const warnings = [];
    
    // Hitta siffror och kontrollera rimlighet
    const numbers = text.match(/\d+[,.]?\d*/g) || [];
    const largeNumbers = numbers.filter(n => parseFloat(n.replace(',', '.')) > 10000);
    
    if (largeNumbers.length > 0) {
      warnings.push('Stora siffror hittades - kontrollera beräkningarna');
    }
    
    // Kontrollera om besparingar verkar orimligt höga
    const savingMatches = text.match(/sparat.*?(\d+[,.]?\d*)/gi);
    if (savingMatches) {
      savingMatches.forEach(match => {
        const amount = parseFloat(match.match(/\d+[,.]?\d*/)?.[0]?.replace(',', '.') || '0');
        if (amount > 1000) {
          warnings.push('Hög besparing hittad - kontrollera beräkningen');
        }
      });
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  return (
    <>
      <main className="container" style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--section-spacing) 0' }}>
          <div style={{ 
          background: 'var(--glass-bg)', 
          backdropFilter: 'var(--glass-blur)', 
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          boxShadow: 'var(--glass-shadow-medium)',
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            Jämför din elräkning med AI
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '2rem', 
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            Ladda upp en bild på din elräkning och få en smart, tydlig analys direkt!
          </p>
          
          {!loading && !gptResult && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1.5rem', 
              alignItems: 'stretch'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1rem',
              alignItems: 'stretch'
            }}>
              <label htmlFor="file-upload" style={{ display: 'flex', justifyContent: 'center' }}>
                  <GlassButton as="span" variant="primary" size="lg" background="linear-gradient(135deg, var(--primary), var(--secondary))" disableScrollEffect disableHoverEffect>
                  Välj fakturabild
                </GlassButton>
              </label>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '1rem', 
                textAlign: 'center',
                  padding: '0.5rem 0',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {file ? file.name : 'Ingen fil vald'}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                <input
                  type="checkbox"
                  checked={consentToStore}
                  onChange={(e) => setConsentToStore(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ lineHeight: 1.4 }}>
                  Jag godkänner att min fakturabild lagras säkert för att förbättra AI‑analysen. Jag kan begära radering när som helst. Läs mer i vår <a href={withDefaultCtaUtm('/integritetspolicy', 'jamfor', 'integritetspolicy')} target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>integritetspolicy</a>.
                </span>
              </label>
            </div>
            <GlassButton
              onClick={handleGptOcr}
              disabled={!file || loading}
              variant="primary"
                size="lg"
                background="linear-gradient(135deg, var(--primary), var(--secondary))"
              disableScrollEffect
              disableHoverEffect
            >
              Analysera faktura
            </GlassButton>
          </div>
        )}
        </div>

        {error && (
          <div style={{ 
            color: '#ef4444', 
            marginTop: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)'
          }}>
            {error}
          </div>
        )}

                 {loading && (
           <div style={{ 
            marginTop: '2rem', 
            background: 'var(--glass-bg)', 
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem 2rem', 
            boxShadow: 'var(--glass-shadow-medium)',
             textAlign: 'center'
           }}>
             <div style={{ 
               width: 60, 
               height: 60, 
              border: '4px solid rgba(255, 255, 255, 0.3)', 
              borderTop: '4px solid var(--primary)', 
               borderRadius: '50%', 
               animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem auto'
             }}></div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem', 
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
               Analyserar din faktura...
             </h3>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255, 255, 255, 0.8)', 
              margin: 0,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
               AI:n läser av alla kostnader och identifierar dolda avgifter
             </p>
           </div>
         )}

        {gptResult && (
          <div className="analysis-fade-in" style={{ 
            marginTop: '2rem', 
            background: 'var(--glass-bg)', 
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', 
            padding: '2rem', 
            boxShadow: 'var(--glass-shadow-medium)' 
          }}>
                          <h3 style={{ 
                fontSize: '1.75rem', 
                fontWeight: 600, 
                marginBottom: '1.5rem', 
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <AnalysisIcon />
                Elbespararens analys
              </h3>
            
            {/* Visa varningar om beräkningar verkar felaktiga */}
            {(() => {
              const validation = validateCalculations(gptResult);
              if (!validation.isValid) {
                return (
                  <div style={{ 
                    marginBottom: '1.5rem', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1.5rem', 
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)'
                  }}>
                    <h4 style={{ 
                      color: 'white', 
                      fontSize: '1.1rem', 
                      fontWeight: 600, 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      Varning - Kontrollera beräkningarna
                    </h4>
                    <ul style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      margin: 0, 
                      fontSize: '0.9rem', 
                      lineHeight: 1.5,
                      paddingLeft: '1.5rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Visa endast sammanfattningen först */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <ReactMarkdown
                components={{
                  h3: (props) => {
                    const content = props.children?.toString() || '';
                    let Icon = null;
                    
                    if (content.includes('Analys av din elräkning')) {
                      Icon = AnalysisIcon;
                    } else if (content.includes('Totala kostnader')) {
                      Icon = SavingsIcon;
                    } else if (content.includes('Analys av onödiga kostnader')) {
                      Icon = SavingsIcon;
                    } else if (content.includes('Möjlig besparing')) {
                      Icon = SavingsIcon;
                    } else if (content.includes('Slutsats')) {
                      Icon = ConclusionIcon;
                    } else if (content.includes('Rekommendation')) {
                      Icon = RecommendationIcon;
                    }
                    
                    return (
                      <h3 style={{
                        color: 'black', 
                        fontSize: '1.25rem', 
                        marginTop: '1.5rem', 
                        marginBottom: '0.75rem', 
                        borderBottom: '2px solid var(--primary)', 
                        paddingBottom: '0.5rem',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {Icon && <Icon />}
                        {props.children}
                      </h3>
                    );
                  },
                  h4: (props) => {
                    const content = props.children?.toString() || '';
                    let Icon = null;
                    
                    if (content.includes('Elförbrukning och kostnader')) {
                      Icon = AnalysisIcon;
                    } else if (content.includes('Viktig information')) {
                      Icon = RecommendationIcon;
                    }
                    
                    return (
                      <h4 style={{
                        color: 'black', 
                        fontSize: '1.1rem', 
                        marginTop: '1.25rem', 
                        marginBottom: '0.5rem', 
                        fontWeight: 600,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {Icon && <Icon />}
                        {props.children}
                      </h4>
                    );
                  },
                  li: (props) => {
                    const content = props.children?.toString() || '';
                    // Check if this is a contract option and convert to link
                    if (content.includes('Rörligt avtal:')) {
                      const parts = content.split('Rörligt avtal:');
                      const description = parts[1] || '';
                      return (
                        <li style={{
                          marginBottom: '0.5rem', 
                          lineHeight: 1.5,
                          color: 'rgba(255, 255, 255, 0.9)',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}>
                          <a 
                            href={withDefaultCtaUtm('/rorligt-avtal', 'jamfor', 'cta-rorligt')}
                            onClick={() => trackContractClick('rorligt')}
                            style={{
                              color: '#10b981',
                              fontWeight: 600,
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            Rörligt avtal:
                          </a>
                          {description}
                        </li>
                      );
                    }
                    if (content.includes('Fastpris med prisgaranti:') || content.includes('Fastprisavtal:')) {
                      const parts = content.split(/Fastpris(?: med prisgaranti|avtal):/);
                      const description = parts[1] || '';
                      return (
                        <li style={{
                          marginBottom: '0.5rem', 
                          lineHeight: 1.5,
                          color: 'rgba(255, 255, 255, 0.9)',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}>
                          <a 
                            href={withDefaultCtaUtm('/fastpris-avtal', 'jamfor', 'cta-fastpris')}
                            onClick={() => trackContractClick('fastpris')}
                            style={{
                              color: '#10b981',
                              fontWeight: 600,
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            {content.includes('Fastprisavtal:') ? 'Fastprisavtal:' : 'Fastpris med prisgaranti:'}
                          </a>
                          {description}
                        </li>
                      );
                    }
                    return <li style={{
                      marginBottom: '0.5rem', 
                      lineHeight: 1.5,
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }} {...props} />;
                  },
                  strong: (props) => <strong style={{
                    color: 'white', 
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }} {...props} />,
                  code: (props) => <code style={{
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.125rem 0.375rem', 
                    fontFamily: 'monospace', 
                    color: '#ef4444',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }} {...props} />,
                  p: (props) => <p style={{
                    marginBottom: '0.75rem', 
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }} {...props} />,
                  ul: (props) => <ul style={{
                    marginBottom: '1rem', 
                    paddingLeft: '1.5rem'
                  }} {...props} />,
                  ol: (props) => <ol style={{
                    marginBottom: '1rem', 
                    paddingLeft: '1.5rem'
                  }} {...props} />,
                  blockquote: (props) => (
                    <blockquote style={{
                      borderLeft: '4px solid var(--primary)',
                      paddingLeft: '1rem',
                      margin: '1rem 0',
                      background: 'rgba(0, 201, 107, 0.1)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                      fontStyle: 'italic',
                      border: '1px solid rgba(0, 201, 107, 0.2)'
                    }} {...props} />
                  ),
                  // Custom styling för viktiga siffror och slutsatser
                  div: (props) => {
                    const content = props.children?.toString() || '';
                    if (content.includes('Detta är summan du har i el:') || 
                        content.includes('Detta är summan du har i extraavgifter:') ||
                        content.includes('Vid byte till ett avtal utan extraavgifter skulle du')) {
                      return (
                        <div className="analysis-summary analysis-highlight" style={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: 'black',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }} {...props} />
                      );
                    }
                    return <div {...props} />;
                  }
                }}
              >
                {hasSummarySection(gptResult) ? getSummarySection(gptResult) : gptResult}
              </ReactMarkdown>
            </div>

            {/* Visa knapp för att expandera endast om det finns en slutsats */}
            {hasSummarySection(gptResult) && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <GlassButton
                  variant="secondary"
                  size="md"
                  background="rgba(255, 255, 255, 0.2)"
                  disableScrollEffect
                  disableHoverEffect
                  onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                >
                  {showFullAnalysis ? 'Dölj detaljerad uträkning' : 'Visa hela uträkningen'}
                </GlassButton>
              </div>
            )}

            {/* Visa detaljerad uträkning om expanderad */}
            {showFullAnalysis && hasSummarySection(gptResult) && (
              <div className="analysis-slide-in" style={{ 
                marginTop: '1.5rem', 
                padding: '1.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)'
              }}>
                <h4 style={{ 
                  color: 'white', 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  marginBottom: '1rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AnalysisIcon />
                  Detaljerad uträkning
                </h4>
            <ReactMarkdown
              components={{
                    h3: (props) => {
                      const content = props.children?.toString() || '';
                      let Icon = null;
                      
                      if (content.includes('Analys av din elräkning')) {
                        Icon = AnalysisIcon;
                      } else if (content.includes('Totala kostnader')) {
                        Icon = SavingsIcon;
                      } else if (content.includes('Analys av onödiga kostnader')) {
                        Icon = SavingsIcon;
                      } else if (content.includes('Möjlig besparing')) {
                        Icon = SavingsIcon;
                      } else if (content.includes('Slutsats')) {
                        Icon = ConclusionIcon;
                      } else if (content.includes('Rekommendation')) {
                        Icon = RecommendationIcon;
                      }
                      
                      return (
                        <h3 style={{
                          color: 'black', 
                          fontSize: '1.1rem', 
                          marginTop: '1.25rem', 
                          marginBottom: '0.5rem', 
                          fontWeight: 600,
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {Icon && <Icon />}
                          {props.children}
                        </h3>
                      );
                    },
                    h4: (props) => {
                      const content = props.children?.toString() || '';
                      let Icon = null;
                      
                      if (content.includes('Elförbrukning och kostnader')) {
                        Icon = AnalysisIcon;
                      } else if (content.includes('Viktig information')) {
                        Icon = RecommendationIcon;
                      }
                      
                      return (
                        <h4 style={{
                          color: 'black', 
                          fontSize: '1rem', 
                          marginTop: '1rem', 
                          marginBottom: '0.375rem', 
                          fontWeight: 600,
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {Icon && <Icon />}
                          {props.children}
                        </h4>
                      );
                    },
                    li: (props) => {
                      const content = props.children?.toString() || '';
                      // Check if this is a contract option and convert to link
                      if (content.includes('Rörligt avtal:')) {
                        const parts = content.split('Rörligt avtal:');
                        const description = parts[1] || '';
                        return (
                          <li style={{
                            marginBottom: '0.25rem', 
                            lineHeight: 1.4,
                            color: 'rgba(255, 255, 255, 0.9)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}>
                            <a 
                              href={withDefaultCtaUtm('/rorligt-avtal', 'jamfor', 'cta-rorligt')}
                              onClick={() => trackContractClick('rorligt')}
                              style={{
                                color: '#10b981',
                                fontWeight: 600,
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                            >
                              Rörligt avtal:
                            </a>
                            {description}
                          </li>
                        );
                      }
                      if (content.includes('Fastpris med prisgaranti:') || content.includes('Fastprisavtal:')) {
                        const parts = content.split(/Fastpris(?: med prisgaranti|avtal):/);
                        const description = parts[1] || '';
                        return (
                          <li style={{
                            marginBottom: '0.25rem', 
                            lineHeight: 1.4,
                            color: 'rgba(255, 255, 255, 0.9)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}>
                            <a 
                              href={withDefaultCtaUtm('/fastpris-avtal', 'jamfor', 'cta-fastpris')}
                              onClick={() => trackContractClick('fastpris')}
                              style={{
                                color: '#10b981',
                                fontWeight: 600,
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                            >
                              {content.includes('Fastprisavtal:') ? 'Fastprisavtal:' : 'Fastpris med prisgaranti:'}
                            </a>
                            {description}
                          </li>
                        );
                      }
                      return <li style={{
                        marginBottom: '0.25rem', 
                        lineHeight: 1.4,
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }} {...props} />;
                    },
                    strong: (props) => <strong style={{
                      color: 'white', 
                      fontWeight: 600,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }} {...props} />,
                    p: (props) => <p style={{
                      marginBottom: '0.5rem', 
                      lineHeight: 1.5,
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }} {...props} />,
                    ul: (props) => <ul style={{
                      marginBottom: '0.75rem', 
                      paddingLeft: '1rem'
                    }} {...props} />,
                    ol: (props) => <ol style={{
                      marginBottom: '0.75rem', 
                      paddingLeft: '1rem'
                    }} {...props} />
                  }}
                >
                  {getDetailedSection(gptResult)}
            </ReactMarkdown>
              </div>
            )}
            
            {/* Highlighted summary section */}
            <div className="analysis-slide-in" style={{ 
              marginTop: '2rem', 
              background: 'rgba(245, 158, 11, 0.1)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem', 
              border: '2px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              marginBottom: '2rem'
            }}>
              <h4 style={{ 
                color: 'white', 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                Viktig information
              </h4>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                margin: 0, 
                fontSize: '0.9rem', 
                lineHeight: 1.5,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                AI:n visar ett estimat baserat på din faktura. För mer exakt analys och personlig hjälp, kontakta oss så hjälper vi dig hitta det bästa elavtalet för din situation.
              </p>
            </div>

            <div className="analysis-fade-in" style={{ 
              marginTop: '2rem', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem' 
            }}>
              <h4 style={{ 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                Just nu rekommenderar vi ett av dessa elavtal, beroende på om du vill ha rörligt avtal eller fastprisavtal.
              </h4>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                flexWrap: 'wrap', 
                justifyContent: 'center' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 200 }}>
                  <ButtonWrapper>
                    <GlassButton 
                      variant="primary" 
                      size="lg" 
                      background="linear-gradient(135deg, #10b981, #059669)" 
                      disableScrollEffect={true} 
                      disableHoverEffect={true}
                      onClick={() => {
                        trackContractClick('rorligt');
                        window.location.href = withDefaultCtaUtm('/rorligt-avtal', 'jamfor', 'cta-rorligt');
                      }}
                      aria-label="Rörligt avtal - 0 kr i avgifter första året – utan bindningstid"
                    >
                      Rörligt avtal
                    </GlassButton>
                  </ButtonWrapper>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--foreground)', 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid rgba(0,0,0,0.06)', 
                    padding: '0.35rem 0.6rem', 
                    borderRadius: 9999, 
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  }}>
                    0 kr i avgifter första året – utan bindningstid
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 200 }}>
                  <ButtonWrapper>
                    <GlassButton 
                      variant="secondary" 
                      size="lg" 
                      background="linear-gradient(135deg, #10b981, #059669)" 
                      disableScrollEffect={true} 
                      disableHoverEffect={true}
                      onClick={() => {
                        trackContractClick('fastpris');
                        window.location.href = withDefaultCtaUtm('/fastpris-avtal', 'jamfor', 'cta-fastpris');
                      }}
                      aria-label="Fastpris - Fastpris med prisgaranti"
                    >
                      Fastpris
                    </GlassButton>
                  </ButtonWrapper>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--foreground)', 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid rgba(0,0,0,0.06)', 
                    padding: '0.35rem 0.6rem', 
                    borderRadius: 9999, 
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  }}>
                    Fastpris med prisgaranti
                  </div>
                </div>
              </div>
              <GlassButton 
                variant="secondary" 
                size="md" 
                background="rgba(255, 255, 255, 0.2)" 
                disableScrollEffect 
                disableHoverEffect 
                onClick={handleUploadNew}
              >
                Ladda upp ny faktura
              </GlassButton>
            </div>

            {/* Share results section */}
            <ShareResults 
              analysisResult={gptResult}
              logId={logId}
              onShare={(platform) => {
                // Spåra delning för analytics
                console.log(`Shared on ${platform}`);
              }}
            />

            {/* Contact form section */}
            <div className="analysis-slide-in" style={{ 
              marginTop: '3rem'
            }}>
              <ContactForm />
            </div>
          </div>
        )}
      </main>
    </>
  );
} 