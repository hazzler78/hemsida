"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ChatContactForm from './ChatContactForm';
import ContractChoice from './ContractChoice';
import BillUpload from './BillUpload';

function renderMarkdown(text: string) {
  if (!text) return '';
  
  let html = text
    // Escape HTML to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Headers (h1-h6)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold and italic (handle nested cases)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // ***bold italic***
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // **bold**
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>'); // *italic*
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
  
  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0;"><code style="font-family: monospace; white-space: pre;">$1</code></pre>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$1</a>');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 8px 0; color: #6b7280;">$1</blockquote>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Bullet lists (improved regex)
  html = html.replace(/^[\s]*[-*+] (.*$)/gim, '<li>$1</li>');
  
  // Wrap lists in ul/ol tags
  const lines = html.split('\n');
  let inList = false;
  let listType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^<li>/.test(line);
    const isNumberedListItem = /^\d+\./.test(line);
    
    if (isListItem && !inList) {
      inList = true;
      listType = isNumberedListItem ? 'ol' : 'ul';
      lines[i] = `<${listType} style="margin: 8px 0; padding-left: 20px;">${line}`;
    } else if (!isListItem && inList) {
      inList = false;
      lines[i-1] = lines[i-1] + `</${listType}>`;
    }
  }
  
  // Close any open list
  if (inList) {
    lines[lines.length - 1] = lines[lines.length - 1] + `</${listType}>`;
  }
  
  html = lines.join('\n');
  
  // Line breaks (handle multiple consecutive breaks)
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  
  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote') && !html.startsWith('<pre')) {
    html = `<p style="margin: 0; line-height: 1.6;">${html}</p>`;
  }
  
  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<br\/>\s*<\/p>/g, '');
  
  return html;
}

const initialMessages = [
  {
    role: 'assistant',
    content:
      'Hej! Jag är Grodan – fråga mig om elavtal, byte eller elpriser så hjälper jag dig direkt.'
  }
];

function GrodanIcon() {
  return (
    <Image
      src="/frog_icon.jpeg"
      alt="Grodan"
      width={24}
      height={24}
      style={{ marginRight: 6, borderRadius: '50%' }}
    />
  );
}

// Generera en unik session ID för denna konversation
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function GrokChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
  const [showContractChoice, setShowContractChoice] = useState(false);
  const [contractChoiceSubmitted, setContractChoiceSubmitted] = useState(false);
  const [showBillUpload, setShowBillUpload] = useState(false);
  const [billUploadSubmitted, setBillUploadSubmitted] = useState(false);
  const [showCheapEnergyAutomation, setShowCheapEnergyAutomation] = useState(false);

  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  // Generera session ID när komponenten mountas
  useEffect(() => {
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  // Responsiv bottom-position för chatbubblan och chat window
  const [chatBottom, setChatBottom] = useState(104); // 80px nav + 24px margin
  const [chatWindowBottom, setChatWindowBottom] = useState(120); // 80px nav + 40px margin
  const [chatWindowHeight, setChatWindowHeight] = useState(480);

  // iOS Safari keyboard fix: use visualViewport so chat stays above keyboard when input is focused
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);
  const [visualViewportTop, setVisualViewportTop] = useState(0);

  useEffect(() => {
    function updatePositions() {
      const mobile = window.innerWidth <= 600;
      setChatBottom(mobile ? 120 : 104);
      setChatWindowBottom(mobile ? 140 : 120);
      setChatWindowHeight(mobile ? 400 : 480);
    }
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, []);

  // When chat is open on mobile, sync with visualViewport so iOS keyboard doesn't push chat up
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateViewport = () => {
      if (window.innerWidth <= 600) {
        setVisualViewportHeight(vv.height);
        setVisualViewportTop(vv.offsetTop);
        // Force reflow after keyboard show/hide so iOS hit-testing stays correct (fixes stuck close button)
        requestAnimationFrame(() => {
          const el = chatWindowRef.current;
          if (el) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.transform = 'translateZ(0)';
            // Force reflow for iOS hit-testing (fixes stuck close button)
            htmlEl.getBoundingClientRect();
            htmlEl.style.transform = '';
          }
        });
      }
    };

    updateViewport();
    vv.addEventListener('resize', updateViewport);
    vv.addEventListener('scroll', updateViewport);
    return () => {
      vv.removeEventListener('resize', updateViewport);
      vv.removeEventListener('scroll', updateViewport);
      setVisualViewportHeight(null);
    };
  }, [open]);

  // When chat is open on mobile: add body class to hide bottom nav; remove on close
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open && typeof window !== 'undefined' && window.innerWidth <= 600) {
      document.body.classList.add('chat-open');
      const nav = document.querySelector('.bottom-nav');
      if (nav) nav.setAttribute('aria-hidden', 'true');
      return () => {
        document.body.classList.remove('chat-open');
        const n = document.querySelector('.bottom-nav');
        if (n) n.setAttribute('aria-hidden', 'false');
      };
    }
    document.body.classList.remove('chat-open');
    const n = document.querySelector('.bottom-nav');
    if (n) n.setAttribute('aria-hidden', 'false');
  }, [open]);

  // Scrolla till toppen när chatten öppnas, annars ingen automatisk scroll
  useEffect(() => {
    if (open && !prevOpenRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
    prevOpenRef.current = open;
  }, [open]);

  // Prevent body scroll behind chat when open; always restore on close (fixes stuck state)
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sendMessage = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    try {
      const res = await fetch('/api/grokchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          sessionId: sessionId // Skicka med session ID
        }),
      });
      if (!res.ok) {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          setError(err.error || 'Något gick fel.');
        } else {
          const text = await res.text();
          setError(`Serverfel: ${res.status} ${res.statusText}`);
          console.error('Non-JSON error response:', text.substring(0, 200));
        }
        setLoading(false);
        return;
      }
      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        setError('Fick inte JSON-svar från servern');
        console.error('Non-JSON response:', text.substring(0, 200));
        setLoading(false);
        return;
      }
      const data = await res.json();
      let aiMsg = data.choices?.[0]?.message?.content || 'Jag kunde tyvärr inte svara just nu.';
      
      // Check if AI wants to show contact form
      if (aiMsg.includes('[SHOW_CONTACT_FORM]')) {
        aiMsg = aiMsg.replace('[SHOW_CONTACT_FORM]', '');
        setShowContactForm(true);
      }
      
      // Check if contact form has been submitted
      if (aiMsg.includes('[CONTACT_FORM_SUBMITTED]')) {
        aiMsg = aiMsg.replace('[CONTACT_FORM_SUBMITTED]', '');
        setContactFormSubmitted(true);
        setShowContactForm(false);
      }
      
      // Check if AI wants to show contract choice
      if (aiMsg.includes('[SHOW_CONTRACT_CHOICE]')) {
        aiMsg = aiMsg.replace('[SHOW_CONTRACT_CHOICE]', '');
        setShowContractChoice(true);
      }
      
      // Check if contract choice has been submitted
      if (aiMsg.includes('[CONTRACT_CHOICE_SUBMITTED]')) {
        aiMsg = aiMsg.replace('[CONTRACT_CHOICE_SUBMITTED]', '');
        setContractChoiceSubmitted(true);
        setShowContractChoice(false);
      }
      
      // Check if AI wants to show bill upload
      if (aiMsg.includes('[SHOW_BILL_UPLOAD]')) {
        aiMsg = aiMsg.replace('[SHOW_BILL_UPLOAD]', '');
        setShowBillUpload(true);
      }
      
      // Check if bill upload has been submitted
      if (aiMsg.includes('[BILL_UPLOAD_SUBMITTED]')) {
        aiMsg = aiMsg.replace('[BILL_UPLOAD_SUBMITTED]', '');
        setBillUploadSubmitted(true);
        setShowBillUpload(false);
      }
      
      // Check if AI wants to start Cheap Energy automation
      if (aiMsg.includes('[START_CHEAP_ENERGY_AUTOMATION]')) {
        aiMsg = aiMsg.replace('[START_CHEAP_ENERGY_AUTOMATION]', '');
        setShowCheapEnergyAutomation(true);
      }
      
      // Remove greeting on subsequent assistant replies
      const assistantRepliesSoFar = newMessages.filter(m => m.role === 'assistant').length;
      if (assistantRepliesSoFar >= 1) {
        aiMsg = aiMsg.replace(/^\s*(Hej|Hejsan|Hallå|Tjena|God\s*(morgon|dag|kväll))[,!\.\s-]*/i, '').trimStart();
      }
      
      setMessages([...newMessages, { role: 'assistant', content: aiMsg }]);
    } catch {
      setError('Kunde inte kontakta AI:n.');
    } finally {
      setLoading(false);
    }
  };

  // Funktion för att rensa chatten och starta ny session
  const clearChat = () => {
    setMessages(initialMessages);
    setInput('');
    setSessionId(generateSessionId()); // Generera ny session ID
    setShowContactForm(false);
    setContactFormSubmitted(false);
    setShowContractChoice(false);
    setContractChoiceSubmitted(false);
    setShowBillUpload(false);
    setBillUploadSubmitted(false);
  };

  // Funktion för att hantera avtalsval
  const handleContractChoice = async (contractType: 'rorligt' | 'fastpris') => {
    setShowContractChoice(false);
    setContractChoiceSubmitted(true);
    

    
    // Lägg till användarens val i chatten
    const choiceMessage = contractType === 'rorligt' 
      ? 'Jag väljer rörligt avtal'
      : 'Jag väljer fastpris';
    
    setMessages(prev => [...prev, { role: 'user', content: choiceMessage }]);
    
    // Skicka meddelande till AI för bekräftelse
    const response = await fetch('/api/grokchat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: choiceMessage }],
        sessionId,
        contractChoice: contractType,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      
      // Navigering till rätt sida efter kort fördröjning
      setTimeout(() => {
        const targetPage = contractType === 'rorligt' 
          ? '/rorligt-avtal-v2'
          : '/fastpris-avtal';
        
        // Lägg till en notifiering i chatten
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '**🎯 Perfekt val!** Du skickas nu till registrering...' 
        }]);
        
        window.location.href = targetPage;
      }, 2000); // 2 sekunders fördröjning så användaren hinner se AI-svaret
    }
  };

  // Funktion för att stänga avtalsval
  const closeContractChoice = () => {
    setShowContractChoice(false);
    const newMessages = [...messages, { role: 'user', content: 'Nej tack, jag tänker mig för' }];
    setMessages(newMessages);
  };

  // Memoized callback for bill analysis
  const handleBillAnalyzed = useCallback((result: string) => {
    // Add the analysis result to chat using functional state update
    setMessages(prevMessages => [...prevMessages, { 
      role: 'assistant', 
      content: `**📊 Analys av din elräkning:**\n\n${result}` 
    }]);
    setBillUploadSubmitted(true);
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: chatBottom,
          right: 24,
          zIndex: 10000,
          background: '#ffffff',
          color: 'white',
          border: '1px solid rgba(148, 163, 184, 0.6)',
          borderRadius: '50%',
          width: 56,
          height: 56,
          boxShadow: 'var(--glass-shadow-light)',
          cursor: 'pointer',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 0,
          overflow: 'hidden',
        }}
        aria-label={open ? 'Stäng chat' : 'Öppna chat'}
      >
        <Image
          src="/frog_icon.jpeg"
          alt="Öppna Grodan-chat"
          width={56}
          height={56}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        />
      </button>
      {/* Chat window */}
      {open && (
        <div
          ref={chatWindowRef}
          style={{
            position: 'fixed',
            pointerEvents: 'auto',
            right: 24,
            width: 'max(280px, min(500px, calc(100vw - 48px)))',
            maxWidth: 'calc(100vw - 48px)',
            boxSizing: 'border-box',
            ...(visualViewportHeight !== null
              ? {
                  top: visualViewportTop,
                  height: visualViewportHeight,
                  maxHeight: '90vh',
                }
              : {
                  bottom: chatWindowBottom,
                  height: chatWindowHeight,
                  maxHeight: '90vh',
                }),
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 18,
            boxShadow: 'var(--glass-shadow-heavy)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
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
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              pointerEvents: 'auto',
              flexShrink: 0,
            }}
          >
            <span><GrodanIcon /> Grodan – AI-chat</span>
            <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
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
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
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
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                }} 
                aria-label="Stäng"
              >
                ×
              </button>
            </div>
          </div>
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              padding: '1rem',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: 'rgba(248, 250, 252, 0.8)',
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}>
                {msg.role === 'assistant' && <GrodanIcon />}
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
                    {msg.role === 'user' ? 'Du' : 'Grodan'}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: 18,
              }}>
                <GrodanIcon />
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
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>
                    Grodan
                  </div>
                  <div>Skriver...</div>
                </div>
              </div>
            )}
            {showContactForm && (
              <div style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <GrodanIcon />
                <div style={{
                  background: '#e0f2fe',
                  color: '#17416b',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  maxWidth: 300,
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,106,167,0.12)',
                  marginLeft: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>
                    Grodan
                  </div>
                  <ChatContactForm 
                    onClose={() => setShowContactForm(false)} 
                    onSubmitted={() => {
                      // Add a message indicating the form was submitted
                      const newMessages = [...messages, { 
                        role: 'assistant', 
                        content: 'Tack för din kontakt! Vi återkommer så snart som möjligt. Ha en fin dag!' 
                      }];
                      setMessages(newMessages);
                      setContactFormSubmitted(true);
                    }}
                  />
                </div>
              </div>
            )}
            {showContractChoice && (
              <ContractChoice 
                onSelect={handleContractChoice}
                onClose={closeContractChoice}
              />
            )}
            {showBillUpload && (
              <div style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <GrodanIcon />
                <div style={{
                  background: '#f0fdf4',
                  color: '#17416b',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  maxWidth: 300,
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
                  marginLeft: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>
                    Grodan
                  </div>
                  <BillUpload 
                    onAnalyzed={handleBillAnalyzed}
                  />
                </div>
              </div>
            )}
            {showCheapEnergyAutomation && (
              <div style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <GrodanIcon />
                <div style={{
                  background: '#fef3c7',
                  color: '#17416b',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  maxWidth: 320,
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.12)',
                  marginLeft: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, opacity: 0.7 }}>
                    Grodan
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    Perfekt! Jag kan hjälpa dig byta elavtal automatiskt. 
                    Klicka på knappen nedan för att starta automation-chatten där vi samlar in all information steg-för-steg och fyller i formuläret åt dig.
                  </div>
                  <button
                    onClick={() => {
                      setShowCheapEnergyAutomation(false);
                      // Trigger custom event to open CheapEnergyChat
                      window.dispatchEvent(new CustomEvent('openCheapEnergyChat'));
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Perfekt! Jag öppnar nu Cheap Energy automation-chatten där vi samlar in all information steg-för-steg och fyller i formuläret automatiskt åt dig!'
                      }]);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: 8,
                    }}
                  >
                    Starta automation ⚡
                  </button>
                </div>
              </div>
            )}
            {error && <div style={{ color: 'red', fontSize: 15, marginLeft: 8 }}>{error}</div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            flexShrink: 0,
            boxSizing: 'border-box',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: '0.5rem 0.5rem max(0.5rem, env(safe-area-inset-bottom)) 0.5rem',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
          }}>
            <input
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={contactFormSubmitted ? "Tack för din kontakt!" : contractChoiceSubmitted ? "Tack för ditt val!" : billUploadSubmitted ? "Analysen är klar!" : "Skriv din fråga…"}
              style={{ 
                flex: 1,
                minWidth: 0,
                border: '1px solid rgba(203, 213, 225, 0.5)', 
                borderRadius: 12, 
                padding: '0.8rem 0.75rem', 
                fontSize: 16, 
                outline: 'none', 
                background: contactFormSubmitted || contractChoiceSubmitted || billUploadSubmitted ? 'rgba(243, 244, 246, 0.8)' : 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                boxSizing: 'border-box',
              }}
              disabled={loading || contactFormSubmitted || contractChoiceSubmitted || billUploadSubmitted}
              maxLength={500}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim() || contactFormSubmitted || contractChoiceSubmitted || billUploadSubmitted} 
              style={{ 
                flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                color: 'white', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                padding: '0 22px', 
                fontSize: 18, 
                cursor: 'pointer', 
                borderRadius: 12, 
                fontWeight: 700, 
                height: 44,
                minWidth: 44,
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              ➤
            </button>
            <button 
              type="button" 
              onClick={() => setShowContactForm(true)}
              disabled={contactFormSubmitted || contractChoiceSubmitted || billUploadSubmitted}
              style={{ 
                flexShrink: 0,
                background: contactFormSubmitted || contractChoiceSubmitted || billUploadSubmitted ? 'rgba(148, 163, 184, 0.5)' : 'linear-gradient(135deg, var(--secondary), var(--primary))', 
                color: 'white', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                padding: '0 12px', 
                fontSize: 16, 
                cursor: 'pointer', 
                borderRadius: 12, 
                fontWeight: 600, 
                height: 44,
                minWidth: 44,
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              title="Kontakta oss"
            >
              📞
            </button>
          </form>
        </div>
      )}
    </>
  );
} 