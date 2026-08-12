'use client';

import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

/**
 * Knappen visas först när NEXT_PUBLIC_WHATSAPP_NUMBER är satt
 * (internationellt format utan +, t.ex. 46701234567).
 * Dold tills Business-nummer är klart.
 */
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const PREFILL_TEXT = 'Hej Elchef! Jag har en fråga om elavtal.';

/** Sitter ovanför Grodan-chatten (56px knapp + 12px gap). */
function buttonBottom(chatBottom: number) {
  return chatBottom + 56 + 12;
}

export default function WhatsAppFloatingButton() {
  const [chatBottom, setChatBottom] = useState(104);

  useEffect(() => {
    if (!WHATSAPP_NUMBER) return;
    function updatePosition() {
      const mobile = window.innerWidth <= 600;
      setChatBottom(mobile ? 120 : 104);
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  if (!WHATSAPP_NUMBER) {
    return null;
  }

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILL_TEXT)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatta med oss på WhatsApp"
      title="Fråga oss på WhatsApp"
      style={{
        position: 'fixed',
        bottom: buttonBottom(chatBottom),
        right: 24,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#25D366',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.45)',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 211, 102, 0.55)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.45)';
      }}
    >
      <FaWhatsapp size={30} aria-hidden="true" />
    </a>
  );
}
