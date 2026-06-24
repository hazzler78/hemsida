'use client';

import { useEffect, useState } from 'react';
import { ADMIN_PASSWORD, readAdminAuthed, writeAdminAuthed } from '@/lib/adminAuth';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthed(readAdminAuthed());
    setReady(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      writeAdminAuthed();
      setError('');
      return;
    }
    setError('Fel lösenord!');
  }

  if (!ready) {
    return (
      <div
        style={{ minHeight: '100vh', background: '#f3f4f6' }}
        aria-busy="true"
        aria-label="Laddar admin"
      />
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        <div
          style={{
            maxWidth: 400,
            margin: '4rem auto',
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 style={{ marginBottom: 16, textAlign: 'center' }}>Admininloggning</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Lösenord"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                marginBottom: 12,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                borderRadius: 8,
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Logga in
            </button>
          </form>
          {error && (
            <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
