"use client";
import React, { useEffect } from "react";
import styled from "styled-components";
import Image from "next/image";
import { withDefaultCtaUtm } from '@/lib/utm';
import { getOrCreateSessionId } from '@/lib/sessionId';

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
 * Banner A/B (feb–jul 2026): A (AI/faktura) vann klart över B (solceller).
 * CTR all time ~2.8% vs ~1.5%; senaste 30d ~3.2% vs ~0.7%.
 * A är nu enda varianten. Tracking behålls som variant A för historik.
 */
const BANNER_WINNER_VARIANT = 'A' as const;
const BANNER_VARIANT_KEY = 'banner_variant_v2';

export default function CampaignBanner() {
  const href = withDefaultCtaUtm('/fakturaanalys', 'banner', 'variantA', 'ai-savings');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(BANNER_VARIANT_KEY, BANNER_WINNER_VARIANT);
      // Rensa gammal A/B-sticky så ingen sitter kvar på solceller-B
      window.localStorage.removeItem('banner_variant_v1');
      window.localStorage.removeItem('banner_variant_expiry_v1');

      const key = `banner_impression_${BANNER_WINNER_VARIANT}`;
      const last = Number(window.localStorage.getItem(key) || '0');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!last || now - last > dayMs) {
        const sessionId = getOrCreateSessionId();
        const payload = JSON.stringify({ variant: BANNER_WINNER_VARIANT, sessionId });
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
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const sessionId = getOrCreateSessionId();
      const payload = JSON.stringify({ variant: BANNER_WINNER_VARIANT, href, sessionId });
      const url = '/api/events/banner-click';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
      window.location.href = href;
    } catch {
      window.location.href = href;
    }
  };

  return (
    <Banner>
      <Image src="/favicon.svg" alt="Elchef" width={20} height={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
      Bara en faktura – se din <Highlight>möjliga besparing</Highlight> på 30 sekunder.
      <StyledLink href={href} onClick={handleClick}>Se direkt</StyledLink>
    </Banner>
  );
}
