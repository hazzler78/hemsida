/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
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
  best_price_badge_text?: string;
}

interface UserPreferences {
  annualUsage?: number;
  currentProvider?: string;
  priority?: 'price' | 'security' | 'flexibility';
  postalCode?: string;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
`;

const Content = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    transition: width 0.3s ease;
  }
`;

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 1.2rem;
  }
`;

const QuestionTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 1rem;
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: 1.8rem;
  }
`;

const QuestionText = styled.p`
  color: #374151;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #374151;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 147, 255, 0.1);
  }
`;


const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const OptionButton = styled.button<{ selected?: boolean }>`
  padding: 1rem;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : '#e5e7eb'};
  border-radius: 12px;
  background: ${props => props.selected ? 'rgba(22, 147, 255, 0.1)' : 'white'};
  color: ${props => props.selected ? 'var(--primary)' : '#374151'};
  font-weight: ${props => props.selected ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  
  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(22, 147, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TrustBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  color: #059669;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.5rem;
`;

const TrustSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;


const ProvidersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
  align-items: stretch;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
`;

const ProviderCard = styled.div<{ recommended?: boolean }>`
  position: relative;
  background: ${props => props.recommended ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: ${props => props.recommended ? '0 20px 40px rgba(22, 147, 255, 0.2)' : '0 20px 40px rgba(0, 0, 0, 0.1)'};
  border: ${props => props.recommended ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.2)'};
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  
  @media (min-width: 768px) {
    min-height: 350px;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.recommended ? '0 30px 60px rgba(22, 147, 255, 0.3)' : '0 30px 60px rgba(0, 0, 0, 0.15)'};
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(22, 147, 255, 0.3);
  z-index: 10;
`;

const InfoBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 10;
`;

const BestPriceBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  z-index: 10;
  white-space: nowrap;
  
  @media (max-width: 640px) {
    font-size: 0.75rem;
    padding: 0.4rem 1rem;
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
`;

const ProviderButton = styled.a`
  display: inline-block;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
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
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

const LOGO_MAPPING: Record<string, string> = {
  'Cheap Energy': '/cheap-logo.png',
  'Svekraft': '/svekraft-logo.png',
  'Tibber': '/tibber.png',
  'Telinet Energi': '/telinet.png',
  'Fortum': '/fortum.png',
  'Eon': '/eon.png',
  'E.ON': '/eon.png',
  'Greenely': '/greenely.png',
  'Skellefteå Kraft': '/skelleftea.png',
  'Skellefteå': '/skelleftea.png',
  'Vattenfall': '/vattenfall.png',
  'Bixia': '/bixia.png',
};

const FALLBACK_PROVIDERS: PageProvider[] = [
  {
    id: 1,
    name: 'Cheap Energy',
    type: 'rorligt',
    logo_url: '/cheap-logo.png',
    description: '0 kr i månadsavgift, 0 öre i påslag i 12 månader. Ingen bindningstid.',
    url: 'https://www.cheapenergy.se/elchef-rorligt/',
    is_recommended: true,
    display_order: 1,
    active: true,
  },
  {
    id: 2,
    name: 'Svekraft',
    type: 'rorligt',
    logo_url: '/svekraft-logo.png',
    description: '0 kr i månadsavgift i 12 månader, 7,99 öre i påslag. Ingen bindningstid.',
    url: 'https://www.svekraft.com/elchef-rorligt/',
    is_recommended: false,
    display_order: 2,
    active: true,
  },
  {
    id: 3,
    name: 'Tibber',
    type: 'rorligt',
    logo_url: '/tibber.png',
    description: '49 kr i månadsavgift, 8,6 öre i påslag. Ingen bindningstid.',
    url: 'https://go.adt242.com/t/t?a=1590956516&as=2012933659&t=2&tk=1',
    is_recommended: false,
    display_order: 3,
    active: true,
  },
  {
    id: 4,
    name: 'Telinet Energi',
    type: 'rorligt',
    logo_url: '/telinet.png',
    description: '59 kr i månadsavgift, 13,33 öre i påslag. Ingen bindningstid.',
    url: 'https://at.telinet.se/t/t?a=1870484942&as=2012933659&t=2&tk=1',
    is_recommended: false,
    display_order: 4,
    active: true,
  },
  {
    id: 5,
    name: 'Fortum',
    type: 'rorligt',
    logo_url: '/fortum.png',
    description: '69 kr i månadsavgift, 12,38 öre i påslag. Ingen bindningstid.',
    url: 'https://ion.fortum.com/t/t?a=1312475339&as=2012933659&t=2&tk=1',
    is_recommended: false,
    display_order: 5,
    active: true,
  },
];

function getLogoUrl(providerName: string, existingLogoUrl?: string): string {
  if (existingLogoUrl && existingLogoUrl.trim() !== '') {
    return existingLogoUrl;
  }
  if (LOGO_MAPPING[providerName]) {
    return LOGO_MAPPING[providerName];
  }
  const normalizedName = Object.keys(LOGO_MAPPING).find(
    key => key.toLowerCase() === providerName.toLowerCase()
  );
  if (normalizedName) {
    return LOGO_MAPPING[normalizedName];
  }
  return '';
}

function getRecommendedProviders(providers: PageProvider[], preferences: UserPreferences): PageProvider[] {
  // Sortera baserat på preferenser
  const sorted = [...providers];
  
  if (preferences.priority === 'price') {
    // Prioritera billigaste (Cheap Energy först)
    sorted.sort((a, b) => {
      if (a.is_recommended) return -1;
      if (b.is_recommended) return 1;
      return a.display_order - b.display_order;
    });
  } else if (preferences.priority === 'security') {
    // Prioritera större, etablerade leverantörer
    sorted.sort((a, b) => {
      const established = ['Tibber', 'Fortum', 'Eon', 'E.ON'];
      const aEstablished = established.includes(a.name);
      const bEstablished = established.includes(b.name);
      if (aEstablished && !bEstablished) return -1;
      if (!aEstablished && bEstablished) return 1;
      return a.display_order - b.display_order;
    });
  }
  
  return sorted;
}

export default function RorligtAvtalV2Page() {
  const [step, setStep] = useState<'questions' | 'results'>('questions');
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [failedLogos, setFailedLogos] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers?type=rorligt&active=true');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Kunde inte hämta leverantörer');
        }
        
        if (result.providers && result.providers.length > 0) {
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
              logo_url: logoUrl,
              best_price_badge_text: provider.best_price_badge_text && provider.best_price_badge_text.trim() !== '' ? provider.best_price_badge_text : undefined
            };
          });
          setProviders(mergedProviders);
        } else {
          setProviders(FALLBACK_PROVIDERS);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
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
          content_id: 'rorligt-avtal-v2',
          content_name: 'Rörligt avtal V2',
          content_type: 'product'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ViewContent', { content_id: 'rorligt-avtal-v2', content_name: 'Rörligt avtal V2', content_type: 'product' });
        }
      }
    } catch { /* no-op */ }
  }, []);

  const handleContinue = () => {
    if (preferences.annualUsage && preferences.priority) {
      // Ta bort besparingskalkylatorn - vi kan inte garantera korrekta besparingar utan att veta användarens nuvarande avtal
      setStep('results');
    }
  };

  const handleProviderClick = (providerName: string, url: string) => {
    try {
      // Generera unikt tracking-ID för att koppla försäljningar till klick
      const trackingId = `elchef_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const sessionId = typeof window !== 'undefined' ? (window.localStorage.getItem('invoice_session_id') || '') : '';
      const cameViaRobinhood = typeof window !== 'undefined' ? (() => {
        const flag = localStorage.getItem('came_via_robinhood');
        const time = localStorage.getItem('came_via_robinhood_time');
        if (flag === 'true' && time) {
          const timeDiff = Date.now() - parseInt(time, 10);
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
          contractType: 'rorligt',
          url,
          sessionId,
          cameViaRobinhood,
          source: 'rorligt-avtal-v2',
          preferences: preferences,
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

      const ttq: any = (window as any).ttq;
      const cookiebot: any = (window as any).cookiebot || (window as any).Cookiebot || (window as any).CookieControl;
      if (ttq && (!cookiebot || cookiebot?.consent?.marketing)) {
        ttq.track('ClickButton', {
          content_name: `affiliate_${providerName}_v2`,
          content_type: 'product'
        });
        if ((window as any).__ttq_capi) {
          (window as any).__ttq_capi('ClickButton', { content_name: `affiliate_${providerName}_v2`, content_type: 'product' });
        }
      }
    } catch { /* no-op */ }
  };

  const recommendedProviders = step === 'results' ? getRecommendedProviders(providers, preferences) : providers;
  const progress = step === 'questions' ? 50 : 100;

  return (
    <PageContainer>
      <Content>
        <Title>Hitta ditt perfekta rörliga elavtal</Title>
        <Subtitle>Vi hjälper dig hitta det bästa avtalet baserat på dina behov</Subtitle>
        
        <ProgressBar progress={progress} />

        {step === 'questions' ? (
          <StepContainer>
            <QuestionTitle>Berätta lite om dina preferenser</QuestionTitle>
            <QuestionText>Svara på några frågor så visar vi leverantörer som matchar vad du letar efter</QuestionText>

            <InputGroup>
              <Label>Ungefärlig årsförbrukning (kWh/år) *</Label>
              <Input
                type="number"
                placeholder="t.ex. 5000"
                value={preferences.annualUsage || ''}
                onChange={(e) => setPreferences({ ...preferences, annualUsage: parseInt(e.target.value) || undefined })}
              />
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Hittar du inte siffran? Kolla på din senaste elräkning eller använd genomsnittet 5000 kWh/år.
              </div>
            </InputGroup>

            <InputGroup>
              <Label>Vad är viktigast för dig? *</Label>
              <ButtonGrid>
                <OptionButton
                  selected={preferences.priority === 'price'}
                  onClick={() => setPreferences({ ...preferences, priority: 'price' })}
                >
                  💰 Lägsta pris
                </OptionButton>
                <OptionButton
                  selected={preferences.priority === 'security'}
                  onClick={() => setPreferences({ ...preferences, priority: 'security' })}
                >
                  🛡️ Trygghet
                </OptionButton>
                <OptionButton
                  selected={preferences.priority === 'flexibility'}
                  onClick={() => setPreferences({ ...preferences, priority: 'flexibility' })}
                >
                  🔄 Flexibilitet
                </OptionButton>
              </ButtonGrid>
            </InputGroup>

            <InputGroup>
              <Label>Nuvarande leverantör (valfritt)</Label>
              <Input
                type="text"
                placeholder="t.ex. Vattenfall, Eon, etc."
                value={preferences.currentProvider || ''}
                onChange={(e) => setPreferences({ ...preferences, currentProvider: e.target.value })}
              />
            </InputGroup>

            <InputGroup>
              <Label>Postnummer (valfritt - för elområde)</Label>
              <Input
                type="text"
                placeholder="t.ex. 12345"
                value={preferences.postalCode || ''}
                onChange={(e) => setPreferences({ ...preferences, postalCode: e.target.value })}
                maxLength={5}
              />
            </InputGroup>

            <PrimaryButton
              onClick={handleContinue}
              disabled={!preferences.annualUsage || !preferences.priority}
            >
              Visa mina rekommendationer →
            </PrimaryButton>
          </StepContainer>
        ) : (
          <>
            <TrustSection>
              <TrustBadge>✓ 100% säkert</TrustBadge>
              <TrustBadge>✓ Ingen bindningstid</TrustBadge>
              <TrustBadge>✓ Vi hjälper till hela vägen</TrustBadge>
              <TrustBadge>✓ Din gamla avtal sägs upp automatiskt</TrustBadge>
            </TrustSection>


            <StepContainer>
              <QuestionTitle>Leverantörer som matchar dina preferenser</QuestionTitle>
              <QuestionText>
                Här är leverantörer som matchar vad du söker efter. 
                {preferences.priority === 'price' && ' Vi har sorterat med fokus på lägsta pris först.'}
                {preferences.priority === 'security' && ' Vi har sorterat med fokus på etablerade leverantörer först.'}
                {preferences.priority === 'flexibility' && ' Vi har sorterat med fokus på flexibla avtal utan bindningstid först.'}
                {' '}Läs gärna igenom alla alternativ innan du väljer.
              </QuestionText>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#374151', padding: '2rem' }}>
                  Laddar leverantörer...
                </div>
              ) : (
                <ProvidersGrid>
                  {recommendedProviders.map((provider, index) => (
                    <ProviderCard key={provider.id} recommended={index === 0 && preferences.priority === 'price'}>
                      {provider.best_price_badge_text && provider.best_price_badge_text.trim() !== '' && (
                        <BestPriceBadge>{provider.best_price_badge_text}</BestPriceBadge>
                      )}
                      {!provider.best_price_badge_text && index === 0 && preferences.priority === 'price' && (
                        <InfoBadge>Matchar dina preferenser</InfoBadge>
                      )}
                      {!provider.best_price_badge_text && provider.is_recommended && !(index === 0 && preferences.priority === 'price') && (
                        <RecommendedBadge>Rekommenderat</RecommendedBadge>
                      )}
                      {provider.logo_url && provider.logo_url.trim() !== '' && !failedLogos.has(provider.id) && (
                        <ProviderLogo 
                          src={provider.logo_url} 
                          alt={provider.name}
                          onError={() => {
                            setFailedLogos(prev => new Set(prev).add(provider.id));
                          }}
                        />
                      )}
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
                </ProvidersGrid>
              )}

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={() => setStep('questions')}
                  style={{
                    background: 'transparent',
                    border: '2px solid #e5e7eb',
                    color: '#374151',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  ← Ändra mina svar
                </button>
              </div>
            </StepContainer>
          </>
        )}
      </Content>
    </PageContainer>
  );
}
