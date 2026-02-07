/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import styled from 'styled-components';
import { MOTALA_LOGO_SRC } from '@/lib/providerLogos';
import { getElectricityArea, type ElectricityArea } from '@/lib/types';

/** Månadskostnad, påslag och pristyp från /api/prices/providers (prisfiler). */
type ProviderPriceItem = {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
  rate_type: 'hourly' | 'monthly';
};
type ProviderPricesMap = Record<string, ProviderPriceItem>;

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
  width: auto;
  margin: 0 auto 1rem;
  display: block;
  object-fit: contain;
  align-self: center;
  
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

const PriceBlock = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
`;

// Fallback: månadskostnad kr när leverantör saknas i prisfilerna
const MÅNADSAVGIFT_KR: Record<string, number> = {
  'Cheap Energy': 0,
  'Svekraft': 0,
  'Tibber': 49,
  'Telinet Energi': 59,
  'Fortum': 69,
  'Eon': 0,
  'E.ON': 0,
  'Greenely': 69,
  'Skellefteå Kraft': 0,
  'Skellefteå': 0,
  'Vattenfall': 45,
  'Bixia': 39,
  'Motala': 20,
  'Motala Energi': 20,
  'Stockholms Elbolag': 32,
};

function getMånadskostnadKr(providerName: string): number {
  if (MÅNADSAVGIFT_KR[providerName] !== undefined) return MÅNADSAVGIFT_KR[providerName];
  const key = Object.keys(MÅNADSAVGIFT_KR).find((k) => k.toLowerCase() === providerName.toLowerCase());
  return key !== undefined ? MÅNADSAVGIFT_KR[key] : 0;
}

// Fallback: påslag öre/kWh när leverantör saknas i prisfilerna
const PÅSLAG_ÖRE_PER_KWH: Record<string, number> = {
  'Cheap Energy': 0,
  'Svekraft': 6.86,
  'Tibber': 11.6,
  'Telinet Energi': 9.71,
  'Fortum': 9.9,
  'Eon': 0,
  'E.ON': 0,
  'Greenely': 0,
  'Skellefteå Kraft': 7.5,
  'Skellefteå': 7.5,
  'Vattenfall': 17.58,
  'Bixia': 5,
  'Motala': 12.38,
  'Motala Energi': 12.38,
};

function getPåslagÖrePerKwh(providerName: string): number {
  if (PÅSLAG_ÖRE_PER_KWH[providerName] !== undefined) {
    return PÅSLAG_ÖRE_PER_KWH[providerName];
  }
  const key = Object.keys(PÅSLAG_ÖRE_PER_KWH).find(
    (k) => k.toLowerCase() === providerName.toLowerCase()
  );
  return key !== undefined ? PÅSLAG_ÖRE_PER_KWH[key] : 0;
}

/** Leverantörer som inte har prisfiler – priser sätts manuellt (MÅNADSAVGIFT_KR, PÅSLAG_ÖRE_PER_KWH). */
const PROVIDERS_MANUAL_PRICE = new Set([
  'Skellefteå', 'Skellefteå Kraft', 'Greenely', 'Bixia', 'Vattenfall', 'Tibber', 'Telinet Energi', 'Fortum',
]);

/** Hämtar månadskostnad + påslag från API-svar (prisfiler). Returnerar null för leverantörer med manuella priser. */
function getProviderPriceFromApi(providerName: string, providers: ProviderPricesMap | null): ProviderPriceItem | null {
  if (!providers) return null;
  const isManual = PROVIDERS_MANUAL_PRICE.has(providerName) ||
    [...PROVIDERS_MANUAL_PRICE].some((k) => k.toLowerCase() === providerName.toLowerCase());
  if (isManual) return null;
  if (providers[providerName]) return providers[providerName];
  const key = Object.keys(providers).find((k) => k.toLowerCase() === providerName.toLowerCase());
  return key ? providers[key] : null;
}

// Mapping av leverantörsnamn till logotyper
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
    name: 'Cheap Energy',
    type: 'rorligt',
    logo_url: '/cheap-logo.png',
    description: '0 kr i månadsavgift, 0 öre i påslag i 12 månader. Ingen bindningstid.',
    url: 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef',
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
    url: 'https://www.svekraft.com/elavtal/?src=Elchef',
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
  {
    id: 6,
    name: 'Motala',
    type: 'rorligt',
    logo_url: MOTALA_LOGO_SRC,
    description: 'Konkurrenskraftiga elavtal för privatpersoner.',
    url: 'https://motalaenergi.se/privatperson/?src=Elchef',
    is_recommended: false,
    display_order: 6,
    active: true,
  },
];

/** Förbrukningsintervall (kWh/år) – matchar prisfilernas segment. */
const CONSUMPTION_OPTIONS: { value: number; label: string }[] = [
  { value: 2500, label: 'Under 5 000 kWh/år' },
  { value: 7500, label: '5 000–10 000 kWh/år' },
  { value: 13500, label: '10 000–17 000 kWh/år' },
  { value: 25000, label: 'Över 17 000 kWh/år' },
];

const AREA_OPTIONS: { value: ElectricityArea; label: string }[] = [
  { value: 'se1', label: 'SE1 (Norra Sverige)' },
  { value: 'se2', label: 'SE2 (Norra Mellansverige)' },
  { value: 'se3', label: 'SE3 (Södra Mellansverige)' },
  { value: 'se4', label: 'SE4 (Södra Sverige)' },
];

export default function RorligtAvtalPage() {
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failedLogos, setFailedLogos] = React.useState<Set<number>>(new Set());
  const [providerPrices, setProviderPrices] = React.useState<ProviderPricesMap | null>(null);
  const [providerPricesLoading, setProviderPricesLoading] = React.useState(false);
  const [priceArea, setPriceArea] = React.useState<ElectricityArea>('se3');
  const [consumptionKwhPerYear, setConsumptionKwhPerYear] = React.useState(13500);
  const [postalInput, setPostalInput] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setProviderPricesLoading(true);
    const fetchProviderPrices = async () => {
      try {
        const res = await fetch(`/api/prices/providers?area=${priceArea}&consumption=${consumptionKwhPerYear}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setProviderPrices(data.providers ?? null);
        }
      } catch {
        if (!cancelled) setProviderPrices(null);
      } finally {
        if (!cancelled) setProviderPricesLoading(false);
      }
    };
    fetchProviderPrices();
    return () => { cancelled = true; };
  }, [priceArea, consumptionKwhPerYear]);

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 5);
    setPostalInput(raw === '' ? '' : raw);
    if (raw.length === 5) {
      try {
        const area = getElectricityArea(raw);
        setPriceArea(area);
      } catch {
        // behåll nuvarande area
      }
    }
  };

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers?type=rorligt&active=true');
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
      // Generera unikt tracking-ID för att koppla försäljningar till klick
      const trackingId = `elchef_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
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
        <Title>Jämför rörliga elavtal i Sverige</Title>
        <Subtitle>
          Vi har valt ut starka alternativ för rörliga elavtal. Ange elområde och förbrukning så visar vi det billigaste priset – standard är SE3 och ca 12 000 kWh/år (vanligt för många hushåll). Ändra nedan om det inte stämmer.
        </Subtitle>

        <div style={{
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <label htmlFor="area-select" style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.95rem', fontWeight: 500 }}>
              Elområde:
            </label>
            <select
              id="area-select"
              value={priceArea}
              onChange={(e) => setPriceArea(e.target.value as ElectricityArea)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.95)',
                color: '#111827',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minWidth: '220px',
              }}
              aria-label="Välj elområde"
            >
              {AREA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>eller postnummer:</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="t.ex. 111 22"
              value={postalInput === '' ? '' : postalInput.replace(/(\d{3})(\d{2})/, '$1 $2')}
              onChange={handlePostalChange}
              maxLength={6}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.95)',
                color: '#111827',
                fontSize: '0.95rem',
                width: '100px',
              }}
              aria-label="Postnummer för att sätt elområde automatiskt"
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <label htmlFor="consumption-select" style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.95rem', fontWeight: 500 }}>
              Ungefärlig årsförbrukning:
            </label>
            <select
              id="consumption-select"
              value={consumptionKwhPerYear}
              onChange={(e) => setConsumptionKwhPerYear(Number(e.target.value))}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.95)',
                color: '#111827',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minWidth: '200px',
              }}
              aria-label="Välj ungefärlig årsförbrukning i kWh"
            >
              {CONSUMPTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', width: '100%', textAlign: 'center' }}>
              Ungefär: lägenhet ofta 5 000–10 000 kWh/år, villa ofta 10 000–17 000 eller mer.
            </span>
          </div>
          {providerPricesLoading && (
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>Uppdaterar priser…</span>
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
                    alt={`${provider.name} logotyp – rörligt elavtal i Sverige`}
                    onError={() => {
                      setFailedLogos(prev => new Set(prev).add(provider.id));
                    }}
                  />
                )}
                {provider.is_recommended && <HighlightBadge>Rekommenderat</HighlightBadge>}
                <ProviderName>{provider.name}</ProviderName>
                {(() => {
                  const fromApi = getProviderPriceFromApi(provider.name, providerPrices);
                  const månadKr = fromApi?.monthly_fee_kr ?? getMånadskostnadKr(provider.name);
                  const påslagValue = fromApi?.surcharge_ore_per_kwh ?? getPåslagÖrePerKwh(provider.name);
                  const rateLabel = fromApi?.rate_type === 'monthly' ? 'Rörligt månadspris' : 'Rörligt timpris';
                  const påslagText =
                    påslagValue === 0
                      ? '0 öre/kWh i påslag'
                      : påslagValue < 0
                        ? `${påslagValue.toLocaleString('sv-SE')} öre/kWh i påslag (minuspåslag)`
                        : `${påslagValue.toLocaleString('sv-SE')} öre/kWh i påslag`;
                  return (
                    <PriceBlock>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>{rateLabel}</span>
                      <span>{månadKr === 0 ? '0 kr/månad' : `${månadKr} kr/månad`}</span>
                      <span>{påslagText}</span>
                    </PriceBlock>
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
