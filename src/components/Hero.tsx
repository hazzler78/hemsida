/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styled from 'styled-components';
import React, { useEffect, useState, useCallback } from 'react';
import GlassButton from './GlassButton';
import { withDefaultCtaUtm } from '@/lib/utm';

const HeroSection = styled.section`
  padding: var(--section-spacing) 0;
  background: transparent;
  overflow: hidden;
  position: relative;
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
  width: 100%;
  min-width: 0;

  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
    align-items: center;
    justify-content: space-between;
  }
`;

const TextContent = styled.div`
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 600px;
  overflow-wrap: break-word;
  word-break: break-word;
  
  h1 {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    margin-bottom: 1.5rem;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    @media (min-width: 768px) {
      font-size: 3.5rem;
    }
  }
  
  p {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 2rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
    gap: 1.5rem;
  }
`;

const VideoWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  aspect-ratio: 16/9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--glass-shadow-heavy);
  max-width: 600px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.2);

  video, iframe {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
    border: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
  }
`;

const USPList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 2rem 0;
  color: #fff;
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
`;

export default function Hero() {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('hero_variant_v1') : null;
      const storedExpiry = typeof window !== 'undefined' ? window.localStorage.getItem('hero_variant_expiry_v1') : null;
      const now = Date.now();
      const isExpired = storedExpiry ? now > Number(storedExpiry) : true;
      if (stored && (stored === 'A' || stored === 'B') && !isExpired) {
        setVariant(stored as 'A' | 'B');
        return;
      }
      const newVariant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
      const expiry = now + 30 * 24 * 60 * 60 * 1000;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('hero_variant_v1', newVariant);
        window.localStorage.setItem('hero_variant_expiry_v1', String(expiry));
      }
      setVariant(newVariant);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = `hero_impression_${variant}`;
      const last = Number(window.localStorage.getItem(key) || '0');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!last || now - last > dayMs) {
        const sessionId = window.localStorage.getItem('invoice_session_id') || '';
        const payload = JSON.stringify({ variant, sessionId });
        const url = '/api/events/hero-impression';
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(
            () => {}
          );
        }
        window.localStorage.setItem(key, String(now));
      }
    } catch {
      // no-op
    }
  }, [variant]);

  const heroTitle: string =
    variant === 'A' ? 'Trött på elräkningar som rusar?' : 'Stoppa onödigt dyra elräkningar.';
  const heroSub: string =
    variant === 'A'
      ? 'Vi lyfter fram rörliga elavtal som är värda att överväga och sköter bytet åt dig – utan telefonköer eller papperskrångel.'
      : 'Välj ett rörligt elavtal vi själva skulle rekommendera till familj och vänner.';

  const buttonBackground =
    variant === 'A'
      ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
      : 'linear-gradient(135deg, #fbbf24, #fde68a)';
  const buttonTextColor = variant === 'A' ? 'white' : '#1f2937';

  const trackHeroClick = useCallback((target: 'rorligt' | 'fastpris', href: string) => {
    try {
      const sessionId = (typeof window !== 'undefined') ? (window.localStorage.getItem('invoice_session_id') || '') : '';
      const sid = (typeof window !== 'undefined') ? (window.localStorage.getItem('invoice_session_id') || '') : '';
      const withSid = href + (href.includes('?') ? `&sid=${encodeURIComponent(sid)}` : `?sid=${encodeURIComponent(sid)}`);
      const finalUrl = withDefaultCtaUtm(withSid, 'hero', `variant${variant}`, 'hero-ab');
      const payload = JSON.stringify({ variant, sessionId, target, href: finalUrl });
      const url = '/api/events/hero-click';
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }

      // TikTok ClickButton event (after Cookiebot marketing consent)
      try {
        const cookiebot: any =
          (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
        const ttq: any = (window as any).ttq;
        if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
          ttq.track('ClickButton', {
            content_name: target,
            content_type: 'product',
          });
          if ((window as any).__ttq_capi) {
            (window as any).__ttq_capi('ClickButton', { content_name: target, content_type: 'product' });
          }
        }
      } catch {
        /* no-op */
      }
      // Bara öppna nytt fönster för externa länkar
      if (href.startsWith('http')) {
        window.open(finalUrl, '_blank');
      }
    } catch {
      // Bara öppna nytt fönster för externa länkar
      if (href.startsWith('http')) {
        window.open(href, '_blank');
      }
    }
  }, [variant]);
  
  const YOUTUBE_VIDEO_ID = '9qwwv5kwHYM';
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}`;

  return (
    <HeroSection>
      <div className="container">
        <HeroContent>
          <TextContent>
            <h1>{String(heroTitle)}</h1>
            <p>{String(heroSub)}</p>
            <ButtonRow>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  minWidth: 0,
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                <div
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 10,
                    transition: 'all 0.3s ease',
                    width: '100%',
                  }}
                  onMouseEnter={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.filter = 'brightness(1.05)';
                  }, [])}
                  onMouseLeave={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }, [])}
                  onClick={() => {
                    trackHeroClick('rorligt', '/rorligt-avtal');
                    // TikTok InitiateCheckout-style event när vi skickar användaren till Salesys-flödet
                    try {
                      const ttq: any = (window as any).ttq;
                      const cookiebot: any =
                        (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
                      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
                        ttq.track('InitiateCheckout', {
                          content_name: 'rorligt_avtal_click',
                        });
                        if ((window as any).__ttq_capi) {
                          (window as any).__ttq_capi('InitiateCheckout', { content_name: 'rorligt_avtal_click' });
                        }
                      }
                    } catch {
                      /* no-op */
                    }
                    const sid =
                      typeof window !== 'undefined' ? window.localStorage.getItem('invoice_session_id') || '' : '';
                    const url = '/rorligt-avtal' + (sid ? `?sid=${encodeURIComponent(sid)}` : '');
                    window.location.href = url;
                  }}
                >
                  <GlassButton
                    variant="primary"
                    size="lg"
                    background={buttonBackground}
                    color={buttonTextColor}
                    aria-label="Se rörligt elavtal och byt från dyrt avtal"
                    disableScrollEffect={true}
                    disableHoverEffect={true}
                  >
                    Se rörligt avtal för mitt hem
                  </GlassButton>
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--foreground)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 9999,
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    position: 'relative',
                    zIndex: 10,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  0 kr i månadsavgift första året – utan bindningstid
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = withDefaultCtaUtm(
                      '/fakturaanalys',
                      'hero',
                      'secondary-fakturaanalys'
                    );
                  }}
                  style={{
                    marginTop: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(226, 232, 240, 0.95)',
                    fontSize: '0.9rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Vill du förstå din elräkning först? Ladda upp faktura
                </button>
              </div>
            </ButtonRow>
            <USPList>
              <li>✔️ Vi lyfter fram rörliga elavtal som är värda att överväga.</li>
              <li>✔️ Vi sköter bytet och uppsägningen av ditt gamla avtal.</li>
              <li>✔️ Svensk support när du behöver hjälp.</li>
            </USPList>
          </TextContent>
          <VideoWrapper>
            {!videoStarted ? (
              <button
                type="button"
                onClick={() => setVideoStarted(true)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
                aria-label="Spela video"
              >
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Klicka för att spela video"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 68,
                    height: 48,
                    background: 'rgba(0, 0, 0, 0.75)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  aria-hidden
                >
                  <svg viewBox="0 0 68 48" width="68" height="48">
                    <path fill="#fff" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.31 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.61 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.69-1.55c2.93-.78 4.63-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.61-16.26z" />
                    <path fill="#f00" d="M45 24L27 14v20" />
                  </svg>
                </div>
              </button>
            ) : (
              <iframe
                src={youtubeEmbedUrl}
                title="Elchef presentationsvideo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            )}
          </VideoWrapper>
        </HeroContent>
      </div>
    </HeroSection>
  );
} 