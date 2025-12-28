/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import styled from 'styled-components';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

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
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
  
  @media (min-width: 480px) {
    font-size: 1.8rem;
  }
  
  @media (min-width: 768px) {
    font-size: 2.2rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.4;
  padding: 0 1rem;
  
  @media (min-width: 480px) {
    font-size: 1rem;
    padding: 0;
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 1.2rem;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  @media (min-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
`;

const ProviderCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: 260px;
  
  @media (min-width: 480px) {
    padding: 2rem;
    min-height: 300px;
  }
  
  @media (min-width: 1024px) {
    min-height: 320px;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  }
`;

const ProviderLogo = styled.img`
  height: 50px;
  max-width: 120px;
  margin-bottom: 1rem;
  object-fit: contain;
  
  @media (min-width: 480px) {
    height: 60px;
    max-width: 140px;
    margin-bottom: 1.5rem;
  }
`;

const ProviderName = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
  
  @media (min-width: 480px) {
    font-size: 1.2rem;
  }
  
  @media (min-width: 768px) {
    font-size: 1.3rem;
  }
`;

const ProviderDescription = styled.p`
  color: #374151;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  line-height: 1.4;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  @media (min-width: 480px) {
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    font-size: 0.95rem;
    line-height: 1.6;
  }
  
  @media (min-width: 1024px) {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const ProviderButton = styled.a`
  display: inline-block;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: auto;
  align-self: center;
  
  @media (min-width: 480px) {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
  
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

export default function RorligtAvtalPage() {
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('page_providers')
          .select('*')
          .eq('type', 'rorligt')
          .eq('active', true)
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('Error fetching providers:', error);
          // Fallback till tom array om det finns fel
          setProviders([]);
        } else if (data) {
          setProviders(data);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders([]);
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
          content_id: 'rorligt-avtal',
          content_name: 'Rörligt avtal',
          content_type: 'product'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ViewContent', { content_id: 'rorligt-avtal', content_name: 'Rörligt avtal', content_type: 'product' });
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
          contractType: 'rorligt',
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
        <Title>Välj din leverantör för rörligt avtal</Title>
        <Subtitle>Vi har valt ut de bästa leverantörerna för rörliga elavtal. Välj den som passar dig!</Subtitle>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
            Laddar leverantörer...
          </div>
        ) : (
          <ProvidersGrid>
            {providers.map((provider) => (
              <ProviderCard key={provider.id}>
                <ProviderLogo src={provider.logo_url} alt={provider.name} />
                {provider.is_recommended && <HighlightBadge>Rekommenderat</HighlightBadge>}
                <ProviderName>{provider.name}</ProviderName>
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
