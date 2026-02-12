/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import styled from 'styled-components';
import type { ElectricityArea } from '@/lib/types';
import { MOTALA_LOGO_SRC } from '@/lib/providerLogos';

interface PageProvider {
  id: number;
  name: string;
  type: 'rorligt' | 'fastpris';
  logo_url: string;
  description: string;
  url: string;
  is_recommended: boolean;
  display_order: number;
  active: boolean;
  campaign_text?: string;
  campaign_bold?: boolean;
  campaign_italic?: boolean;
}

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
    gap: 2rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
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
  display: flex;
  flex-direction: column;
  min-height: 280px;
  
  @media (min-width: 1024px) {
    min-height: 300px;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  }
`;

const ProviderLogo = styled.img`
  height: 60px;
  max-width: 140px;
  width: auto;
  margin: 0 auto 1.5rem;
  display: block;
  object-fit: contain;
  align-self: center;
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
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (min-width: 1024px) {
    font-size: 1rem;
    line-height: 1.7;
  }
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
  margin-top: auto;
  align-self: center;
  
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

const PriceBadge = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

// Mapping av leverantörsnamn till logotyper
const LOGO_MAPPING: Record<string, string> = {
  'Cheap Energy': '/cheap-logo.png',
  'Svekraft': '/svekraft-logo.png',
  'Svealands Elbolag': '/svealand-logo.png',
  'Stockholms Elbolag': '/stockholms-elbolag-logo.png',
  'Eon': '/eon.png',
  'E.ON': '/eon.png',
  'Greenely': '/greenely.png',
  'Skellefteå Kraft': '/skelleftea.png',
  'Skellefteå': '/skelleftea.png',
  'Vattenfall': '/vattenfall.png',
  'Bixia': '/bixia.png',
  'Motala': MOTALA_LOGO_SRC,
  'Motala Energi': MOTALA_LOGO_SRC,
};

// Funktion för att hitta logo_url baserat på leverantörsnamn.
// Kända leverantörer (t.ex. Motala) använder alltid mappningen så loggan visas även i produktion.
function getLogoUrl(providerName: string, existingLogoUrl?: string): string {
  const mapped = LOGO_MAPPING[providerName]
    ?? LOGO_MAPPING[Object.keys(LOGO_MAPPING).find(k => k.toLowerCase() === providerName.toLowerCase()) ?? ''];
  if (mapped) return mapped;
  if (existingLogoUrl && existingLogoUrl.trim() !== '') return existingLogoUrl;
  return '';
}

// Fallback leverantörer när databasen inte är tillgänglig
const FALLBACK_PROVIDERS: PageProvider[] = [
  {
    id: 1,
    name: 'Svealands Elbolag',
    type: 'fastpris',
    logo_url: '/svealand-logo.png',
    description: 'Om du hittar ett billigare fastprisavtal på elmarknaden matchas priset – och du får dessutom 1 öre/kWh i extra rabatt. Ett pålitligt val för dig som vill ha kontroll över elkostnaderna.',
    url: 'https://www.svealandselbolag.se/teckna-avtal/?src=Elchef',
    is_recommended: true,
    display_order: 1,
    active: true,
  },
  {
    id: 2,
    name: 'Cheap Energy',
    type: 'fastpris',
    logo_url: '/cheap-logo.png',
    description: 'Konkurrenskraftiga fastpriser. Trygghet och förutsägbarhet för din elförbrukning.',
    url: 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef',
    is_recommended: false,
    display_order: 2,
    active: true,
  },
  {
    id: 3,
    name: 'Stockholms Elbolag',
    type: 'fastpris',
    logo_url: '/stockholms-elbolag-logo.png',
    description: 'Fast elpris med tydliga villkor. Perfekt för dig som vill ha förutsägbara elkostnader.',
    url: 'https://www.stockholmselbolag.se/elavtal/?src=Elchef',
    is_recommended: false,
    display_order: 3,
    active: true,
  },
  {
    id: 4,
    name: 'Svekraft',
    type: 'fastpris',
    logo_url: '/svekraft-logo.png',
    description: 'Stabila fastpriser för din trygghet. Låsta priser som ger dig kontroll över din elbudget.',
    url: 'https://www.svekraft.com/elavtal/?src=Elchef',
    is_recommended: false,
    display_order: 4,
    active: true,
  },
  {
    id: 5,
    name: 'Motala',
    type: 'fastpris',
    logo_url: MOTALA_LOGO_SRC,
    description: 'Konkurrenskraftiga elavtal för privatpersoner.',
    url: 'https://motalaenergi.se/privatperson/?src=Elchef',
    is_recommended: false,
    display_order: 5,
    active: true,
  },
];

/** Avtalslängd – nycklar i prisfilernas variable_fixed_prices. Upp till 1 år i månader, därefter 1–10 år. */
type FixedPeriodKey = '3_months' | '6_months' | '9_months' | '1_year' | '2_years' | '3_years' | '4_years' | '5_years' | '6_years' | '7_years' | '8_years' | '9_years' | '10_years';
const PERIOD_OPTIONS: { value: FixedPeriodKey; label: string }[] = [
  { value: '3_months', label: '3 månader' },
  { value: '6_months', label: '6 månader' },
  { value: '9_months', label: '9 månader' },
  { value: '1_year', label: '1 år' },
  { value: '2_years', label: '2 år' },
  { value: '3_years', label: '3 år' },
  { value: '4_years', label: '4 år' },
  { value: '5_years', label: '5 år' },
  { value: '6_years', label: '6 år' },
  { value: '7_years', label: '7 år' },
  { value: '8_years', label: '8 år' },
  { value: '9_years', label: '9 år' },
  { value: '10_years', label: '10 år' },
];
const PERIOD_LABEL_SHORT: Record<FixedPeriodKey, string> = {
  '3_months': '3 mån',
  '6_months': '6 mån',
  '9_months': '9 mån',
  '1_year': '1 år',
  '2_years': '2 år',
  '3_years': '3 år',
  '4_years': '4 år',
  '5_years': '5 år',
  '6_years': '6 år',
  '7_years': '7 år',
  '8_years': '8 år',
  '9_years': '9 år',
  '10_years': '10 år',
};

export default function FastprisAvtalPage() {
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failedLogos, setFailedLogos] = React.useState<Set<number>>(new Set());
  const [fixedPrices, setFixedPrices] = React.useState<Record<string, number> | null>(null);
  const [loadingPrices, setLoadingPrices] = React.useState(true);
  const [priceArea, setPriceArea] = React.useState<ElectricityArea>('se3');
  const [contractPeriod, setContractPeriod] = React.useState<FixedPeriodKey>('1_year');

  React.useEffect(() => {
    let cancelled = false;
    setLoadingPrices(true);
    const fetchFixedPrices = async () => {
      try {
        const res = await fetch(`/api/prices/providers/fixed?area=${priceArea}&period=${contractPeriod}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setFixedPrices(data.providers ?? null);
        } else {
          setFixedPrices(null);
        }
      } catch {
        if (!cancelled) setFixedPrices(null);
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    };
    fetchFixedPrices();
    return () => { cancelled = true; };
  }, [priceArea, contractPeriod]);

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers?type=fastpris&active=true');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Kunde inte hämta leverantörer');
        }
        
        if (result.providers && result.providers.length > 0) {
          console.log('Fetched providers from D1:', result.providers);
          // Merge with fallback data and logo mapping to ensure logo_url is always present
          const mergedProviders = result.providers.map((provider: PageProvider) => {
            const fallbackProvider = FALLBACK_PROVIDERS.find(fb => fb.name === provider.name);
            const logoUrl = getLogoUrl(
              provider.name,
              provider.logo_url && provider.logo_url.trim() !== '' 
                ? provider.logo_url 
                : fallbackProvider?.logo_url
            );
            return {
              ...provider,
              logo_url: logoUrl
            };
          });
          setProviders(mergedProviders);
        } else {
          console.warn('No providers returned from D1, using fallback providers');
          setProviders(FALLBACK_PROVIDERS);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        // Fallback till hårdkodade leverantörer vid fel
        console.log('Using fallback providers due to exception');
        setProviders(FALLBACK_PROVIDERS);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

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
      // Generera unikt tracking-ID för att koppla försäljningar till klick
      const trackingId = `elchef_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Track affiliate link click
      const sessionId = typeof window !== 'undefined' ? (window.localStorage.getItem('invoice_session_id') || '') : '';
      const heroVariant = typeof window !== 'undefined' ? window.localStorage.getItem('hero_variant_v1') || null : null;
      // Check if user came via robinhood link (within 24 hours)
      const cameViaRobinhood = typeof window !== 'undefined' ? (() => {
        const flag = localStorage.getItem('came_via_robinhood');
        const time = localStorage.getItem('came_via_robinhood_time');
        if (flag === 'true' && time) {
          const timeDiff = Date.now() - parseInt(time, 10);
          // Valid for 24 hours
          if (timeDiff < 24 * 60 * 60 * 1000) {
            return true;
          }
        }
        return false;
      })() : false;
      
      // Skicka tracking-event (async, vänta inte)
      fetch('/api/events/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          contractType: 'fastpris',
          url,
          sessionId,
          cameViaRobinhood,
          heroVariant,
          trackingId
        }),
        keepalive: true,
      }).catch(() => {});

      // Lägg till tracking-ID i affiliate-länken
      const urlWithTracking = url.includes('?') 
        ? `${url}&elchef_ref=${encodeURIComponent(trackingId)}`
        : `${url}?elchef_ref=${encodeURIComponent(trackingId)}`;

      // Öppna affiliate-länken med tracking-ID
      window.open(urlWithTracking, '_blank');

      // TikTok event
      const ttq: any = (window as any).ttq;
      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
        ttq.track('ClickButton', {
          content_name: `affiliate_${providerName}`,
          content_type: 'product'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ClickButton', { content_name: `affiliate_${providerName}`, content_type: 'product' });
        }
      }
    } catch { /* no-op */ }
  };

  return (
    <PageContainer>
      <Content>
        <Title>Jämför fastprisavtal för el i Sverige</Title>
        <Subtitle>
          Här samlar vi utvalda fastprisavtal för el. Jämför prisnivåer, kampanjer och prisgaranti och hitta
          det fastpris elavtal 2026 som ger dig trygg och förutsägbar elkostnad.
        </Subtitle>

        <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Avtalslängd:</span>
              <select
                value={contractPeriod}
                onChange={(e) => setContractPeriod(e.target.value as FixedPeriodKey)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
                aria-label="Välj avtalslängd"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Elområde:</span>
              <select
                value={priceArea}
                onChange={(e) => setPriceArea(e.target.value as ElectricityArea)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
                aria-label="Välj elområde"
              >
                <option value="se1">SE1 (Norra Sverige)</option>
                <option value="se2">SE2 (Norra Mellansverige)</option>
                <option value="se3">SE3 (Södra Mellansverige)</option>
                <option value="se4">SE4 (Södra Sverige)</option>
              </select>
            </div>
            {loadingPrices && (
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>Laddar priser...</span>
            )}
          </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
            Laddar leverantörer...
          </div>
        ) : (
          <ProvidersGrid>
            {providers.map((provider) => (
              <ProviderCard key={provider.id}>
                {provider.logo_url && provider.logo_url.trim() !== '' && !failedLogos.has(provider.id) && (
                  <ProviderLogo
                    src={provider.logo_url}
                    alt={`${provider.name} logotyp – fastpris elavtal i Sverige`}
                    onError={() => {
                      setFailedLogos(prev => new Set(prev).add(provider.id));
                    }}
                  />
                )}
                {provider.is_recommended && <HighlightBadge>Rekommenderat</HighlightBadge>}
                <ProviderName>{provider.name}</ProviderName>
                {(() => {
                  const price = fixedPrices?.[provider.name]
                    ?? fixedPrices?.[Object.keys(fixedPrices ?? {}).find((k) => k.toLowerCase() === provider.name.toLowerCase()) ?? ''];
                  if (price == null) return null;
                  return (
                    <PriceBadge>
                      Från {price} öre/kWh inkl. moms ({PERIOD_LABEL_SHORT[contractPeriod]}, {priceArea.toUpperCase()})
                    </PriceBadge>
                  );
                })()}
                {provider.campaign_text && (
                  <div style={{
                    fontWeight: provider.campaign_bold ? 'bold' : 'normal',
                    fontStyle: provider.campaign_italic ? 'italic' : 'normal',
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    {provider.campaign_text}
                  </div>
                )}
                <ProviderDescription>
                  {provider.description}
                </ProviderDescription>
                <ProviderButton
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    handleProviderClick(provider.name, provider.url);
                  }}
                >
                  Välj {provider.name}
                </ProviderButton>
              </ProviderCard>
            ))}
            {providers.length === 0 && (
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem', gridColumn: '1 / -1' }}>
                Inga leverantörer tillgängliga för tillfället.
              </div>
            )}
          </ProvidersGrid>
        )}
      </Content>
    </PageContainer>
  );
}
