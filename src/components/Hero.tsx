/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styled from 'styled-components';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import GlassButton from './GlassButton';
import { withDefaultCtaUtm } from '@/lib/utm';
import { getOrCreateSessionId } from '@/lib/sessionId';

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

const VideoOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 10000;
`;

const VideoOverlayContent = styled.div`
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16/9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--glass-shadow-heavy);
  position: relative;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  button.close-overlay {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
    cursor: pointer;
    z-index: 2;
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

/** Vinnare i hero A/B (maj 2026): variant B – grön CTA, högre CTR. */
const HERO_WINNER_VARIANT = 'B' as const;
const HERO_CTA_BACKGROUND = 'linear-gradient(135deg, #22c55e, #16a34a)';
const HERO_CTA_TEXT_COLOR = 'white';
const HERO_TITLE = 'Trött på elräkningar som rusar?';
const HERO_SUB = 'Billigare el väntar – se avtal som lönar sig just nu!';

export default function Hero() {
  const [videoStarted, setVideoStarted] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem('hero_variant_v1', HERO_WINNER_VARIANT);
      const key = `hero_impression_${HERO_WINNER_VARIANT}`;
      const last = Number(window.localStorage.getItem(key) || '0');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!last || now - last > dayMs) {
        const sessionId = getOrCreateSessionId();
        const payload = JSON.stringify({ variant: HERO_WINNER_VARIANT, sessionId });
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
  }, []);

  const trackHeroClick = useCallback((target: 'rorligt' | 'fastpris', href: string) => {
    try {
      const sessionId = getOrCreateSessionId();
      const sid = sessionId;
      const withSid = href + (href.includes('?') ? `&sid=${encodeURIComponent(sid)}` : `?sid=${encodeURIComponent(sid)}`);
      const finalUrl = withDefaultCtaUtm(withSid, 'hero', 'cta', 'hero');
      const payload = JSON.stringify({ variant: HERO_WINNER_VARIANT, sessionId, target, href: finalUrl });
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
  }, []);
  
  const handleStartVideo = useCallback(() => {
    setVideoStarted(true);
  }, []);
  
  const YOUTUBE_VIDEO_ID = '9qwwv5kwHYM';
  // Play with sound when user explicitly starts the video
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}`;

  return (
    <HeroSection>
      <div className="container">
        <HeroContent>
          <TextContent>
            <h1>{HERO_TITLE}</h1>
            <p>{HERO_SUB}</p>
            <ButtonRow>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  minWidth: 0,
                  width: '100%',
                  maxWidth: 360,
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
                    trackHeroClick('rorligt', '/rorligt-avtal-v2');
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
                      typeof window !== 'undefined' ? getOrCreateSessionId() : '';
                    const url = '/rorligt-avtal-v2' + (sid ? `?sid=${encodeURIComponent(sid)}` : '');
                    window.location.href = url;
                  }}
                >
                  <GlassButton
                    variant="primary"
                    size="lg"
                    background={HERO_CTA_BACKGROUND}
                    color={HERO_CTA_TEXT_COLOR}
                    aria-label="Byt elavtal och kom igång"
                    disableScrollEffect={true}
                    disableHoverEffect={true}
                  >
                    Byt elavtal – kom igång
                  </GlassButton>
                </div>
              </div>
            </ButtonRow>
          </TextContent>
          <VideoWrapper ref={videoContainerRef}>
            {!videoStarted || isMobile ? (
              <button
                type="button"
                onClick={handleStartVideo}
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
      {videoStarted && isMobile && (
        <VideoOverlay
          onClick={() => {
            setVideoStarted(false);
          }}
        >
          <VideoOverlayContent
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className="close-overlay"
              onClick={() => {
                setVideoStarted(false);
              }}
            >
              Stäng
            </button>
            <iframe
              src={youtubeEmbedUrl}
              title="Elchef presentationsvideo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </VideoOverlayContent>
        </VideoOverlay>
      )}
    </HeroSection>
  );
} 

export function HeroUSPs() {
  return (
    <section style={{ padding: '2rem 0' }}>
      <div className="container">
        <USPList>
          <li>✔️ Hitta elavtal som faktiskt kan sänka din elkostnad.</li>
          <li>✔️ Byt elavtal på bara några minuter.</li>
          <li>✔️ Mänsklig support när du behöver det.</li>
        </USPList>
      </div>
    </section>
  );
}