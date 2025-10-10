/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Content = styled.div`
  max-width: 1200px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 3rem;
  }
`;

const ProvidersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ProviderCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  }
`;

const ProviderLogo = styled.img`
  height: 60px;
  margin-bottom: 1.5rem;
  object-fit: contain;
`;

const ProviderName = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
`;

const ProviderDescription = styled.p`
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ProviderButton = styled.a`
  display: inline-block;
  background: linear-gradient(135deg, var(--secondary), var(--primary));
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const HighlightBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transform: rotate(-3deg);
  z-index: 10;
`;

export default function FastprisAvtalPage() {
  React.useEffect(() => {
    try {
      const ttq: any = (window as any).ttq;
      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
        ttq.track('ViewContent', {
          content_id: 'fastpris-avtal',
          content_name: 'Fastprisavtal',
          content_type: 'product'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ViewContent', { content_id: 'fastpris-avtal', content_name: 'Fastprisavtal', content_type: 'product' });
        }
      }
    } catch { /* no-op */ }
  }, []);

  const handleProviderClick = (providerName: string, url: string) => {
    try {
      // Track affiliate link click
      const sessionId = typeof window !== 'undefined' ? (window.localStorage.getItem('invoice_session_id') || '') : '';
      fetch('/api/events/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          contractType: 'fastpris',
          url,
          sessionId
        }),
        keepalive: true,
      }).catch(() => {});

      // TikTok event
      const ttq: any = (window as any).ttq;
      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
        ttq.track('ClickButton', {
          content_name: `affiliate_${providerName}`,
          content_type: 'affiliate_link'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ClickButton', { content_name: `affiliate_${providerName}`, content_type: 'affiliate_link' });
        }
      }
    } catch { /* no-op */ }
  };

  return (
    <PageContainer>
      <Content>
        <Title>Välj din leverantör för fastpris</Title>
        <Subtitle>Vi har valt ut de bästa leverantörerna för fastprisavtal. Välj den som passar dig!</Subtitle>

        <ProvidersGrid>
          {/* Svealands Elbolag */}
          <ProviderCard>
            <ProviderLogo src="/svealand-logo.png" alt="Svealands Elbolag" />
            <HighlightBadge>Rekommenderat</HighlightBadge>
            <ProviderName>Svealands Elbolag</ProviderName>
            <ProviderDescription>
              Fastpris med stabil prissättning. Ett pålitligt val för dig som vill ha kontroll över elkostnaderna.
            </ProviderDescription>
            <ProviderButton 
              href="https://www.svealandselbolag.se/elchef-fastpris/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                handleProviderClick('Svealands Elbolag', 'https://www.svealandselbolag.se/elchef-fastpris/');
              }}
            >
              Välj Svealands Elbolag
            </ProviderButton>
          </ProviderCard>

          {/* Cheap Energy */}
          <ProviderCard>
            <ProviderLogo src="/cheap-logo.png" alt="Cheap Energy" />
            <ProviderName>Cheap Energy</ProviderName>
            <ProviderDescription>
              Konkurrenskraftiga fastpriser med prisgaranti. Trygghet och förutsägbarhet för din elförbrukning.
            </ProviderDescription>
            <ProviderButton 
              href="https://www.cheapenergy.se/elchef-fastpris/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                handleProviderClick('Cheap Energy', 'https://www.cheapenergy.se/elchef-fastpris/');
              }}
            >
              Välj Cheap Energy
            </ProviderButton>
          </ProviderCard>

          {/* Stockholms Elbolag */}
          <ProviderCard>
            <ProviderLogo src="/stockholms-elbolag-logo.png" alt="Stockholms Elbolag" />
            <ProviderName>Stockholms Elbolag</ProviderName>
            <ProviderDescription>
              Fast elpris med tydliga villkor. Perfekt för dig som vill ha förutsägbara elkostnader.
            </ProviderDescription>
            <ProviderButton 
              href="https://www.stockholmselbolag.se/elavtal-elchef-fastpris/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                handleProviderClick('Stockholms Elbolag', 'https://www.stockholmselbolag.se/elavtal-elchef-fastpris/');
              }}
            >
              Välj Stockholms Elbolag
            </ProviderButton>
          </ProviderCard>

          {/* Svekraft */}
          <ProviderCard>
            <ProviderLogo src="/svekraft-logo.png" alt="Svekraft" />
            <ProviderName>Svekraft</ProviderName>
            <ProviderDescription>
              Stabila fastpriser för din trygghet. Låsta priser som ger dig kontroll över din elbudget.
            </ProviderDescription>
            <ProviderButton 
              href="https://www.svekraft.com/elchef-fastpris/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                handleProviderClick('Svekraft', 'https://www.svekraft.com/elchef-fastpris/');
              }}
            >
              Välj Svekraft
            </ProviderButton>
          </ProviderCard>
        </ProvidersGrid>
      </Content>
    </PageContainer>
  );
}
