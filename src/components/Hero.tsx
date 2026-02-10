/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styled from 'styled-components';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import GlassButton from './GlassButton';
import { withDefaultCtaUtm } from '@/lib/utm';
import { fetchCheapEnergyPrices } from '@/lib/priceService';
import type { CheapEnergyPrices, ElectricityArea } from '@/lib/types';
import { getElectricityArea } from '@/lib/types';
import { ElectricityAreaMap } from './ElectricityAreaMap';

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

  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
    align-items: center;
    justify-content: space-between;
  }
`;

const TextContent = styled.div`
  flex: 1;
  max-width: 600px;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    @media (min-width: 768px) {
      font-size: 3.5rem;
    }
  }
  
  p {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 2rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
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

  video {
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
  font-size: 1.1rem;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState<ElectricityArea | null>(null);
  const [prices, setPrices] = useState<CheapEnergyPrices | null>(null);
  const [priceStatus, setPriceStatus] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'invalid_postal'>('idle');
  const [priceError, setPriceError] = useState<string | null>(null);

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
    } catch {}
  }, []);

  useEffect(() => {
    setIsMounted(true);
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
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
        }
        window.localStorage.setItem(key, String(now));
      }
    } catch {}
  }, [variant]);

  const heroTitle: string = variant === 'A' ? 'Elchef gör det enkelt att välja rätt elavtal!' : 'Välj rätt elavtal – utan krångel';
  const heroSub: string = variant === 'A' ? 'Vi lyfter fram avtal värda att överväga och sköter bytet åt dig.' : 'Snabbt och tryggt. Vi hjälper dig hela vägen.';

  const formatFixedPrice = (value: unknown): string => {
    if (typeof value === 'number') {
      return `${value} öre/kWh`;
    }
    if (value && typeof value === 'object') {
      const anyVal = value as any;
      const num =
        typeof anyVal.value === 'number'
          ? anyVal.value
          : typeof anyVal.price === 'number'
          ? anyVal.price
          : undefined;
      if (typeof num === 'number') {
        return `${num} öre/kWh`;
      }
    }
    return '—';
  };

  const loadPricesForArea = useCallback(
    async (elArea: ElectricityArea) => {
      try {
        setPriceStatus('loading');
        setPriceError(null);
        setArea(elArea);

        // Hämta priser bara en gång per session och återanvänd datan
        let data = prices;
        if (!data) {
          data = await fetchCheapEnergyPrices();
          setPrices(data);
        }

        if (!data.spot_prices[elArea] && !data.variable_fixed_prices[elArea]) {
          setPriceStatus('error');
          setPriceError('Kunde inte hitta prisdata för ditt område just nu.');
          return;
        }

        setPriceStatus('loaded');
      } catch (error) {
        console.error('Error when looking up prices by area:', error);
        setPriceStatus('error');
        setPriceError('Kunde inte hämta aktuella priser just nu. Försök igen senare eller ladda upp din elräkning för en exakt analys.');
      }
    },
    [prices]
  );

  const handlePostalSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();
      const trimmed = postalCode.replace(/\s/g, '');
      if (!/^\d{5}$/.test(trimmed)) {
        setPriceStatus('invalid_postal');
        setPriceError('Skriv ett giltigt postnummer med 5 siffror.');
        setArea(null);
        return;
      }

      const elArea = getElectricityArea(trimmed);
      await loadPricesForArea(elArea);
    },
    [postalCode, loadPricesForArea]
  );

  const handleAreaClick = useCallback(
    async (selectedArea: ElectricityArea) => {
      await loadPricesForArea(selectedArea);
    },
    [loadPricesForArea]
  );

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
        const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
        const ttq: any = (window as any).ttq;
        if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
          ttq.track('ClickButton', {
            content_name: target,
            content_type: 'product'
          });
          if ((window as any).__ttq_capi) {
            (window as any).__ttq_capi('ClickButton', { content_name: target, content_type: 'product' });
          }
        }
      } catch { /* no-op */ }
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
  
  const handleVideoClick = useCallback((event: React.MouseEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    video.muted = !video.muted; // Växla mellan muted och unmuted
    if (!video.muted) {
      video.play().catch(() => {/* ignore */});
    }
  }, []);

  useEffect(() => {
    // Nudge autoplay on some browsers that require an explicit play() after attach
    const v = videoRef.current;
    if (!v) return;
    
    // Add a small delay to prevent blocking the main thread
    const timeoutId = setTimeout(() => {
      try {
        v.muted = true;
        const playPromise = v.play();
        if (playPromise && typeof (playPromise as Promise<void>).catch === 'function') {
          (playPromise as Promise<void>).catch(() => {/* ignore */});
        }
      } catch {/* ignore */}
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <HeroSection>
      <div className="container">
        <HeroContent>
          <TextContent>
            <h1>{String(heroTitle)}</h1>
            <p>{String(heroSub)}</p>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                border: '1px solid rgba(148, 163, 184, 0.6)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
                marginBottom: '1.5rem',
              }}
            >
              <form
                onSubmit={handlePostalSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <label
                  htmlFor="hero-postal"
                  style={{ fontSize: '0.9rem', color: 'rgba(226, 232, 240, 0.95)', fontWeight: 500 }}
                >
                  Skriv ditt postnummer så visar vi prisnivåer i ditt elområde – eller klicka direkt på kartan:
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'nowrap',
                  }}
                >
                  <input
                    id="hero-postal"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').slice(0, 5);
                      setPostalCode(value);
                      if (priceStatus !== 'idle') {
                        setPriceStatus('idle');
                        setPriceError(null);
                      }
                    }}
                    onBlur={() => {
                      if (postalCode.replace(/\s/g, '').length === 5) {
                        void handlePostalSubmit();
                      }
                    }}
                    placeholder="t.ex. 11122"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 9999,
                      border: '1px solid rgba(148, 163, 184, 0.8)',
                      padding: '0.6rem 0.9rem',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                    aria-label="Postnummer"
                  />
                  <button
                    type="submit"
                    style={{
                      borderRadius: 9999,
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Visa pris
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '1rem' }}>
                <ElectricityAreaMap onAreaSelected={handleAreaClick} value={area} />
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'rgba(226,232,240,0.9)' }}>
                {priceStatus === 'idle' && (
                  <span>Exakt pris visas efter att du har fyllt i ditt postnummer eller valt elområde.</span>
                )}
                {priceStatus === 'invalid_postal' && (
                  <span style={{ color: '#fecaca' }}>Ogiltigt postnummer. Skriv fem siffror, t.ex. 11122.</span>
                )}
                {priceStatus === 'loading' && <span>Hämtar aktuella priser för ditt elområde…</span>}
                {priceStatus === 'error' && priceError && (
                  <span style={{ color: '#fecaca' }}>{priceError}</span>
                )}
                {priceStatus === 'loaded' && prices && area && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <strong>
                      I ditt område ({area.toUpperCase()}): ungefärliga prisnivåer just nu
                    </strong>
                    <span>
                      Rörligt pris (spot):{' '}
                      <strong>
                        ca{' '}
                        {Math.round((prices.spot_prices[area] ?? 0) * 10) / 10}
                      </strong>{' '}
                      öre/kWh
                    </span>
                    <span>
                      Fastpris 6 mån:{' '}
                      <strong>
                        {formatFixedPrice(prices.variable_fixed_prices[area]?.['6_months'])}
                      </strong>
                      , 12 mån:{' '}
                      <strong>
                        {formatFixedPrice(prices.variable_fixed_prices[area]?.['1_year'])}
                      </strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      Priserna är ungefärliga och kan variera beroende på förbrukning och val av elavtal. För en mer exakt
                      genomgång kan du{' '}
                      <a
                        href={withDefaultCtaUtm(
                          `/jamfor-elpriser${postalCode ? `?postal=${postalCode}` : ''}`,
                          'hero',
                          'postal-prices-ai'
                        )}
                        style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                      >
                        ladda upp din elräkning
                      </a>{' '}
                      eller gå vidare till{' '}
                      <a
                        href={withDefaultCtaUtm('/byt-elavtal', 'hero', 'postal-prices-switch')}
                        style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                      >
                        Byt elavtal
                      </a>
                      .
                    </span>
                  </div>
                )}
              </div>
            </div>
                         <ButtonRow>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 220 }}>
                                   <div style={{
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 10,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }, [])}
                  onMouseLeave={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }, [])}
                  onClick={() => {
                    trackHeroClick('rorligt', '/rorligt-avtal');
                    // TikTok InitiateCheckout-style event when we send user to Salesys flow
                    try {
                      const ttq: any = (window as any).ttq;
                      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
                      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
                        ttq.track('InitiateCheckout', {
                          content_name: 'rorligt_avtal_click'
                        });
                        if ((window as any).__ttq_capi) {
                          (window as any).__ttq_capi('InitiateCheckout', { content_name: 'rorligt_avtal_click' });
                        }
                      }
                    } catch { /* no-op */ }
                    const sid = (typeof window !== 'undefined') ? (window.localStorage.getItem('invoice_session_id') || '') : '';
                    const url = '/rorligt-avtal' + (sid ? `?sid=${encodeURIComponent(sid)}` : '');
                    window.location.href = url;
                  }}
                  >
                                                                               <GlassButton 
                       variant="primary" 
                       size="lg"
                       background="linear-gradient(135deg, var(--primary), var(--secondary))"
                       aria-label="Rörligt avtal - 0 kr i månadsavgift första året – utan bindningstid"
                       disableScrollEffect={true}
                       disableHoverEffect={true}
                     >
                     Rörligt avtal
                   </GlassButton>
                 </div>
                 <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--foreground)', 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  padding: '0.35rem 0.6rem', 
                  borderRadius: 9999, 
                  textAlign: 'center',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  position: 'relative',
                  zIndex: 10,
                  whiteSpace: 'nowrap'
                }}>
                   0 kr i månadsavgift första året – utan bindningstid
                 </div>
               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 220 }}>
                                     <div style={{
                     cursor: 'pointer',
                     position: 'relative',
                     zIndex: 10,
                     transition: 'all 0.3s ease'
                   }}
                   onMouseEnter={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                     e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                     e.currentTarget.style.filter = 'brightness(1.1)';
                   }, [])}
                   onMouseLeave={useCallback((e: React.MouseEvent<HTMLDivElement>) => {
                     e.currentTarget.style.transform = 'translateY(0) scale(1)';
                     e.currentTarget.style.filter = 'brightness(1)';
                   }, [])}
                                       onClick={() => {
                      trackHeroClick('fastpris', '/fastpris-avtal');
                      try {
                        const ttq: any = (window as any).ttq;
                        const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
                        if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
                          ttq.track('InitiateCheckout', {
                            content_name: 'fastpris_avtal_click'
                          });
                          if ((window as any).__ttq_capi) {
                            (window as any).__ttq_capi('InitiateCheckout', { content_name: 'fastpris_avtal_click' });
                          }
                        }
                      } catch { /* no-op */ }
                      const sid = (typeof window !== 'undefined') ? (window.localStorage.getItem('invoice_session_id') || '') : '';
                      const url = '/fastpris-avtal' + (sid ? `?sid=${encodeURIComponent(sid)}` : '');
                      window.location.href = url;
                    }}
                   >
                      <GlassButton 
                        variant="secondary" 
                        size="lg"
                        background="linear-gradient(135deg, var(--secondary), var(--primary))"
                        aria-label="Fastpris - samma elpris under hela avtalstiden"
                        disableScrollEffect={true}
                        disableHoverEffect={true}
                      >
                        Fastpris
                      </GlassButton>
                    </div>
                 <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--foreground)', 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  padding: '0.35rem 0.6rem', 
                  borderRadius: 9999, 
                  textAlign: 'center',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  position: 'relative',
                  zIndex: 10
                }}>
                  Samma elpris under hela avtalstiden
                </div>
               </div>
            </ButtonRow>
            <USPList>
              <li>✔️ Vi lyfter fram elavtal som är värda att överväga.</li>
              <li>✔️ Din gamla avtal sägs upp automatiskt.</li>
              <li>✔️ Full valfrihet – välj mellan rörligt elpris eller fastpris med avtalad period.</li>
            </USPList>
          </TextContent>
          <VideoWrapper>
            <video 
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/frog-hero.png"
              onLoadedData={() => { 
                try { 
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {/* ignore */});
                  }
                  setVideoError(null);
                } catch {} 
              }}
              onError={(e) => {
                console.error('Video loading error:', e);
                setVideoError('Video kunde inte laddas');
              }}
              onClick={handleVideoClick}
              style={{ cursor: 'pointer' }}
              title="Klicka för att växla ljud av/på"
            >
              <source src="/grodan-presentation.mp4" type="video/mp4" />
              Din webbläsare stöder inte video-elementet.
            </video>
            {isMounted && videoError && typeof videoError === 'string' && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center',
                padding: '1rem',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '8px'
              }}>
                {String(videoError)}
              </div>
            )}
          </VideoWrapper>
        </HeroContent>
      </div>
    </HeroSection>
  );
} 