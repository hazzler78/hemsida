"use client";
import React, { useEffect, useState } from "react";
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

export default function CampaignBanner() {
  const [variant, setVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('banner_variant_v1') : null;
      const storedExpiry = typeof window !== 'undefined' ? window.localStorage.getItem('banner_variant_expiry_v1') : null;
      const now = Date.now();
      const isExpired = storedExpiry ? now > Number(storedExpiry) : true;

      if (stored && (stored === 'A' || stored === 'B') && !isExpired) {
        setVariant(stored);
        return;
      }

      const newVariant: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
      const expiry = now + 30 * 24 * 60 * 60 * 1000; // 30 dagar
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('banner_variant_v1', newVariant);
        window.localStorage.setItem('banner_variant_expiry_v1', String(expiry));
      }
      setVariant(newVariant);
    } catch {
      // no-op
    }
  }, []);

  // Impression tracking: 1 per 24h per variant
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
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
        }
        window.localStorage.setItem(key, String(now));
      }
    } catch {}
  }, [variant]);

  // A = AI analys → /fakturaanalys. B = Solceller → scroll till #solceller
  const hrefA = withDefaultCtaUtm('/fakturaanalys', 'banner', 'variantA', 'ai-savings');
  const hrefB = typeof window !== 'undefined' ? `${window.location.origin}/#solceller` : '/#solceller';

  const handleClickA = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const sessionId = getOrCreateSessionId();
      const payload = JSON.stringify({ variant: 'A', href: hrefA, sessionId });
      const url = '/api/events/banner-click';
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
      window.location.href = hrefA;
    } catch {
      window.location.href = hrefA;
    }
  };

  const handleClickB = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const sessionId = getOrCreateSessionId();
      const payload = JSON.stringify({ variant: 'B', href: hrefB, sessionId });
      const url = '/api/events/banner-click';
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/' || window.location.pathname === '') {
          const el = document.getElementById('solceller');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = '/#solceller';
        }
      }
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/#solceller';
    }
  };

  // Nudge-stil: A = AI (låg ansträngning, snabb vinst), B = Solceller (nyfikenhet, ingen förpliktelse)
  const textA = (
    <>
      Bara en faktura – se din <Highlight>möjliga besparing</Highlight> på 30 sekunder.
    </>
  );

  const textB = (
    <>
      Nyfiken på <Highlight>solceller</Highlight>? Få en offert – ingen förpliktelse.
    </>
  );

  return (
    <Banner>
      <Image src="/favicon.svg" alt="Elchef" width={20} height={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
      {variant === 'A' ? textA : textB}
      {variant === 'A' ? (
        <StyledLink href={hrefA} onClick={handleClickA}>Se direkt</StyledLink>
      ) : (
        <StyledLink href="/#solceller" onClick={handleClickB}>Begär offert</StyledLink>
      )}
    </Banner>
  );
} 