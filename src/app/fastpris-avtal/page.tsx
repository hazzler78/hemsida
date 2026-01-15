/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import styled from 'styled-components';

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
};

// Funktion för att hitta logo_url baserat på leverantörsnamn
function getLogoUrl(providerName: string, existingLogoUrl?: string): string {
  if (existingLogoUrl && existingLogoUrl.trim() !== '') {
    return existingLogoUrl;
  }
  // Matcha exakt namn först
  if (LOGO_MAPPING[providerName]) {
    return LOGO_MAPPING[providerName];
  }
  // Matcha case-insensitive
  const normalizedName = Object.keys(LOGO_MAPPING).find(
    key => key.toLowerCase() === providerName.toLowerCase()
  );
  if (normalizedName) {
    return LOGO_MAPPING[normalizedName];
  }
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
    url: 'https://www.svealandselbolag.se/elchef-fastpris/',
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
    url: 'https://www.cheapenergy.se/elchef-fastpris/',
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
    url: 'https://www.stockholmselbolag.se/elavtal-elchef-fastpris/',
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
    url: 'https://www.svekraft.com/elchef-fastpris/',
    is_recommended: false,
    display_order: 4,
    active: true,
  },
];

export default function FastprisAvtalPage() {
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failedLogos, setFailedLogos] = React.useState<Set<number>>(new Set());

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
      // Track affiliate link click
      const sessionId = typeof window !== 'undefined' ? (window.localStorage.getItem('invoice_session_id') || '') : '';
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
      
      fetch('/api/events/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          contractType: 'fastpris',
          url,
          sessionId,
          cameViaRobinhood
        }),
        keepalive: true,
      }).catch(() => {});

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
        <Title>Välj din leverantör för fastpris</Title>
        <Subtitle>Vi har valt ut de bästa leverantörerna för fastprisavtal. Välj den som passar dig!</Subtitle>

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
                    alt={provider.name}
                    onError={() => {
                      setFailedLogos(prev => new Set(prev).add(provider.id));
                    }}
                  />
                )}
                {provider.is_recommended && <HighlightBadge>Rekommenderat</HighlightBadge>}
                <ProviderName>{provider.name}</ProviderName>
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
                  onClick={() => {
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
