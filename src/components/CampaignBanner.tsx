"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import { withDefaultCtaUtm } from '@/lib/utm';
import { getOrCreateSessionId } from '@/lib/sessionId';
import ClickIntroVideo from '@/components/ClickIntroVideo';

const Banner = styled.div`
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  text-align: center;
  padding: 1rem 0.75rem;
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: var(--glass-shadow-light);
  z-index: 2000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  transition: all 0.3s ease-in-out;
  overflow-wrap: break-word;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const Highlight = styled.span`
  color: #ffffff;
  font-weight: 700;
`;

const StyledLink = styled.a`
  color: #ffffff;
  margin: 0 0.2em;
  text-decoration: underline;
  font-weight: 700;
  transition: opacity 0.2s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  &:hover {
    opacity: 0.9;
  }
`;

/**
 * Banner A/B v3 (jul 2026):
 * A = kontroll (tidigare vinnare): besparing / låg friktion
 * B = kundförslag: AI visar onödiga avgifter
 * Båda → /fakturaanalys. Sticky 30 dagar via banner_variant_v3.
 */
const BANNER_VARIANT_KEY = 'banner_variant_v3';
const BANNER_EXPIRY_KEY = 'banner_variant_expiry_v3';

type BannerVariant = 'A' | 'B';

export default function CampaignBanner() {
  const [variant, setVariant] = useState<BannerVariant>('A');
  const [showClickIntro, setShowClickIntro] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Rensa äldre test-nycklar så assignment startar om för v3
      window.localStorage.removeItem('banner_variant_v1');
      window.localStorage.removeItem('banner_variant_expiry_v1');
      window.localStorage.removeItem('banner_variant_v2');

      const stored = window.localStorage.getItem(BANNER_VARIANT_KEY);
      const storedExpiry = window.localStorage.getItem(BANNER_EXPIRY_KEY);
      const now = Date.now();
      const isExpired = storedExpiry ? now > Number(storedExpiry) : true;

      let next: BannerVariant;
      if (stored && (stored === 'A' || stored === 'B') && !isExpired) {
        next = stored;
      } else {
        next = Math.random() < 0.5 ? 'A' : 'B';
        const expiry = now + 30 * 24 * 60 * 60 * 1000;
        window.localStorage.setItem(BANNER_VARIANT_KEY, next);
        window.localStorage.setItem(BANNER_EXPIRY_KEY, String(expiry));
      }
      setVariant(next);
    } catch {
      // no-op
    }
  }, []);

  // Impression: max 1 / 24h per variant
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = `banner_impression_${variant}`;
      const last = Number(window.localStorage.getItem(key) || '0');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!last || now - last > dayMs) {
        const sessionId = getOrCreateSessionId();
        const payload = JSON.stringify({ variant, sessionId });
        const url = '/api/events/banner-impression';
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } else {
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
        }
        window.localStorage.setItem(key, String(now));
      }
    } catch {
      // tracking får inte störa UX
    }
  }, [variant]);

  const href =
    variant === 'A'
      ? withDefaultCtaUtm('/fakturaanalys', 'banner', 'variantA', 'ai-savings')
      : withDefaultCtaUtm('/fakturaanalys', 'banner', 'variantB', 'ai-fees');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const sessionId = getOrCreateSessionId();
      const payload = JSON.stringify({ variant, href, sessionId });
      const url = '/api/events/banner-click';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
      setPendingHref(href);
      setShowClickIntro(true);
    } catch {
      setPendingHref(href);
      setShowClickIntro(true);
    }
  };

  const textA = (
    <>
      Bara en faktura – se din <Highlight>möjliga besparing</Highlight> på 30 sekunder.
    </>
  );

  const textB = (
    <>
      <Highlight>AI</Highlight> visar onödiga avgifter på din elräkning – på 30 sekunder.
    </>
  );

  return (
    <>
      <Banner>
        <Image src="/favicon.svg" alt="Elchef" width={20} height={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        {variant === 'A' ? textA : textB}
        <StyledLink href={href} onClick={handleClick}>Se direkt</StyledLink>
      </Banner>
      {showClickIntro && pendingHref && (
        <ClickIntroVideo
          onComplete={() => {
            window.location.href = pendingHref;
          }}
        />
      )}
    </>
  );
}
