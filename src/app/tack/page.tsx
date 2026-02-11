/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";

export default function TackPage() {
  // Avoid hydration mismatch: server has no window; read search params only after mount
  const [sid, setSid] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSid(params.get('sid') || '');
    setStatus(params.get('status') || '');
  }, []);

  useEffect(() => {
    try {
      // Spara sid för eventuell uppföljning i vår egen funnel
      if (sid) {
        localStorage.setItem('invoice_session_id', sid);
      }

      // TikTok Lead efter Cookiebot-samtycke
      const ttq: any = (window as any).ttq;
      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
        ttq.track('Lead', {
          content_name: 'salesys_redirect',
          event_id: sid || undefined,
          status: status || undefined
        });
      }
      if ((window as any).__ttq_capi) {
        (window as any).__ttq_capi('Lead', { content_name: 'salesys_redirect', event_id: sid || undefined, status: status || undefined });
      }
    } catch { /* no-op */ }
  }, [sid, status]);

  return (
    <main className="container" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: 12 }}>Tack!</h1>
      <p>Din förfrågan har tagits emot. Vi återkommer eller så följer du instruktionerna i nästa steg.</p>
      {status && (
        <p style={{ marginTop: 8, opacity: 0.8 }}>Status: <strong>{status}</strong></p>
      )}
      {sid && (
        <p style={{ marginTop: 4, opacity: 0.8 }}>Referens: <code>{sid}</code></p>
      )}
    </main>
  );
}


