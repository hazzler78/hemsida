/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { MOTALA_LOGO_SRC } from '@/lib/providerLogos';
import { getElectricityArea, type ElectricityArea } from '@/lib/types';
import { usePageView } from '@/lib/usePageView';
import { getOrCreateSessionId } from '@/lib/sessionId';
import { openAffiliateUrl } from '@/lib/openAffiliate';
import { CONVERSION_EXPERIMENT } from '@/lib/conversionExperiment';

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
  manual_monthly_fee_kr?: number | null;
  manual_surcharge_ore_per_kwh?: number | null;
  manual_rate_type?: 'hourly' | 'monthly' | 'quarterly' | null;
  best_price_badge_text?: string;
}

interface UserPreferences {
  annualUsage?: number;
  currentProvider?: string;
  priority?: 'price' | 'security' | 'flexibility';
  postalCode?: string;
}

/** Månadskostnad, påslag och pristyp från /api/prices/providers (prisfiler). */
type ProviderPriceItem = {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
  rate_type: 'hourly' | 'monthly';
};

type ProviderPricesMap = Record<string, ProviderPriceItem>;

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

/** Årskostnad (SEK) för sortering – lägre = billigare. Samma logik som rorligt-avtal (v1). */
function getAnnualCostForSort(
  provider: PageProvider,
  providerPrices: ProviderPricesMap | null,
  consumptionKwhPerYear: number
): number {
  const fromApi = getProviderPriceFromApi(provider.name, providerPrices);
  const monthly = fromApi?.monthly_fee_kr ?? provider.manual_monthly_fee_kr ?? getMånadskostnadKr(provider.name);
  const surcharge = fromApi?.surcharge_ore_per_kwh ?? provider.manual_surcharge_ore_per_kwh ?? getPåslagÖrePerKwh(provider.name);
  return monthly * 12 + (surcharge * consumptionKwhPerYear) / 100;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 2rem 1rem 3.5rem;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem 4rem;
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
  margin-bottom: 4rem;
  
  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
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

const SkipButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: var(--primary);
  }
`;

const FeaturedCardWrap = styled.div`
  margin-bottom: 1.5rem;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;

  @media (min-width: 768px) {
    max-width: 480px;
  }
`;

const ShowMoreButton = styled.button`
  display: block;
  width: 100%;
  margin: 0.5rem 0 1.5rem;
  padding: 0.875rem 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

const FastprisCta = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 2.5rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  color: #111827;
  text-decoration: none;
  font-weight: 600;
  transition: box-shadow 0.2s, transform 0.2s;

  span {
    display: block;
    font-weight: 500;
    font-size: 0.9rem;
    color: #64748b;
    margin-top: 0.35rem;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
`;

const TrustBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.96);
  color: #059669;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.5rem;
  border: 1px solid rgba(16, 185, 129, 0.25);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
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

const SafeBottomSpacer = styled.div`
  height: 120px;
  
  @media (min-width: 768px) {
    height: 40px;
  }
`;

/* Shimmer – ljusstrimma som rör sig sakta över kortet (ren CSS) */
const providerCardShimmer = keyframes`
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(100%) skewX(-20deg); }
`;

const CardShimmerLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.35),
      transparent
    );
    transform: skewX(-20deg);
    animation: ${providerCardShimmer} 6s infinite linear;
  }
`;

const ProviderCard = styled.div<{ recommended?: boolean }>`
  position: relative;
  margin-top: 1.75rem;
  text-align: center;
  overflow: visible;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  border-radius: 20px;
  padding: 2rem;
  border: ${props => props.recommended ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.3)'};
  box-shadow: ${props => props.recommended ? '0 20px 40px rgba(22, 147, 255, 0.2)' : '0 20px 40px rgba(0, 0, 0, 0.1)'};
  
  /* Stärkare frosted glass (20px blur) + fallback för äldre mobiler */
  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: ${props => props.recommended ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.88))' : 'rgba(255, 255, 255, 0.9)'};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: ${props => props.recommended ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))' : 'rgba(255, 255, 255, 0.98)'};
  }
  
  /* Innehåll ovanför shimmer */
  & > * {
    position: relative;
    z-index: 1;
  }
  
  @media (min-width: 768px) {
    min-height: 350px;
  }
  
  /* Hover: scale + glow (Liquid Glass) */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow: ${props => props.recommended ? '0 24px 48px rgba(0, 106, 167, 0.3)' : '0 24px 48px rgba(0, 0, 0, 0.2)'};
  }
`;

const ProviderTag = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  background: rgba(34, 197, 94, 0.08);
  color: #047857;
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.4rem 1.3rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(22, 147, 255, 0.3);
  z-index: 10;
  white-space: nowrap;
`;

const BestPriceBadge = styled.div`
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
  padding: 0.4rem 1.3rem;
  border-radius: 9999px;
  font-size: 0.8rem;
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

/** Wrapper so every card has the same space below the button (mobile-first, fixes cards without badge). */
const ProviderButtonRow = styled.div`
  margin-top: auto;
  padding-bottom: 1.5rem;
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
  'Motala': MOTALA_LOGO_SRC,
  'Motala Energi': MOTALA_LOGO_SRC,
};

const FALLBACK_PROVIDERS: PageProvider[] = [
  {
    id: 1,
    name: 'Cheap Energy',
    type: 'rorligt',
    logo_url: '/cheap-logo.png',
    description: 'Vårt billigaste avtal just nu.',
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
    description:
      '0 kr/månad i början och flexibelt rörligt pris – bra om du vill komma igång billigt vid ditt första byte.',
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
    description:
      'Smart timpris via app – perfekt om du har elbil, solceller eller kan styra din el till billigare timmar.',
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
    description:
      'Grönt elavtal från en aktör som funnits länge – för dig som vill ha enkel kundservice och ett konkurrenskraftigt rörligt pris.',
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
    description:
      'Stor och etablerad leverantör med fossilfri el – passar villa och lägenhet om du vill ha ett tryggt byte från t.ex. Vattenfall.',
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
    description:
      'Mindre svensk leverantör med personlig service – bra om du vill kunna ringa någon och ändå ha ett modernt rörligt avtal.',
    url: 'https://motalaenergi.se/privatperson/?src=Elchef',
    is_recommended: false,
    display_order: 6,
    active: true,
  },
];

/** Rörliga leverantörer som kan finnas i API men inte i FALLBACK – undvik tomma kort. */
const RORLIGT_EXTRA_DESCRIPTION_BY_NAME: Record<string, string> = {
  Eon: 'Stor och välkänd leverantör med många kunder. Bra om du vill ha ett rörligt avtal från ett etablerat elbolag.',
  'E.ON': 'Stor och välkänd leverantör med många kunder. Bra om du vill ha ett rörligt avtal från ett etablerat elbolag.',
  Greenely: 'Appstyrd el med fokus på lägre kostnad och klimat – extra bra om du har solceller eller vill optimera förbrukningen.',
  Vattenfall: 'Stor svensk leverantör med brett utbud. Passar om du vill ha en välkänd aktör med etablerad kundservice.',
  Bixia: 'Svenskt elbolag – ofta smidigt byte och enkel kontakt med kundtjänst.',
  'Skellefteå Kraft': 'Regional leverantör med lång erfarenhet – tryggt val om du vill ha rörligt pris från ett bolag i norr.',
  Skellefteå: 'Regional leverantör med lång erfarenhet – tryggt val om du vill ha rörligt pris från ett bolag i norr.',
  'Stockholms Elbolag': 'Lokal förankring och personlig service – bra om du vill ha rörligt avtal från ett mindre bolag.',
};

const RORLIGT_GENERIC_DESCRIPTION =
  'Rörligt elavtal – du betalar marknadspriset för el med leverantörens påslag. Se aktuella villkor och uppsägningstid hos leverantören innan du tecknar.';

function lookupDescriptionMap(map: Record<string, string>, name: string): string | undefined {
  if (map[name]) return map[name];
  const key = Object.keys(map).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? map[key] : undefined;
}

/**
 * Beskrivning under leverantören: kuraterad text i repot ska gälla före D1/API så att
 * produktion matchar det ni ser lokalt (lokalt utan DB används bara FALLBACK-listan).
 * API används när namnet saknas i fallback och extra-mappningen.
 */
function resolveRorligtDescription(provider: PageProvider, fallback?: PageProvider): string {
  const fromFallback = fallback?.description?.trim();
  if (fromFallback) return fromFallback;
  const extra = lookupDescriptionMap(RORLIGT_EXTRA_DESCRIPTION_BY_NAME, provider.name);
  if (extra) return extra;
  const fromApi = provider.description?.trim();
  if (fromApi) return fromApi;
  return RORLIGT_GENERIC_DESCRIPTION;
}

/** Ordning för flexibilitet: enkla, ofta uppsagda rörliga avtal och tydlig digital hantering först (redaktionell prioritering). */
const FLEXIBILITY_ORDER: string[] = [
  'Cheap Energy',
  'Svekraft',
  'Motala',
  'Telinet Energi',
  'Tibber',
  'Fortum',
  'Eon',
  'E.ON',
  'Greenely',
  'Vattenfall',
  'Bixia',
  'Skellefteå Kraft',
  'Skellefteå',
  'Stockholms Elbolag',
];

function flexibilityRank(name: string): number {
  const exact = FLEXIBILITY_ORDER.indexOf(name);
  if (exact >= 0) return exact;
  const ci = FLEXIBILITY_ORDER.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  return ci >= 0 ? ci : 999;
}

const SOLAR_PROVIDERS = new Set(['Tibber', 'Fortum', 'Greenely']);

const PROVIDER_CTA_LABELS: Record<string, string> = {
  'Cheap Energy': 'Teckna hos Cheap Energy – tar ~2 min',
  Svekraft: 'Teckna hos Svekraft – tar ~2 min',
  Tibber: 'Teckna hos Tibber – smart timpris',
  'Telinet Energi': 'Teckna hos Telinet Energi',
  Fortum: 'Teckna hos Fortum – tryggt byte',
  Motala: 'Teckna hos Motala – personlig service',
};

const DEFAULT_SKIP_PREFERENCES: UserPreferences = {
  annualUsage: 5000,
  priority: 'price',
};

// Kända leverantörer (t.ex. Motala) använder alltid mappningen så loggan visas även i produktion.
function getLogoUrl(providerName: string, existingLogoUrl?: string): string {
  const mapped = LOGO_MAPPING[providerName]
    ?? LOGO_MAPPING[Object.keys(LOGO_MAPPING).find(k => k.toLowerCase() === providerName.toLowerCase()) ?? ''];
  if (mapped) return mapped;
  if (existingLogoUrl && existingLogoUrl.trim() !== '') return existingLogoUrl;
  return '';
}

function getRecommendedProviders(
  providers: PageProvider[],
  preferences: UserPreferences,
  providerPrices: ProviderPricesMap | null,
  consumptionKwhPerYear: number
): PageProvider[] {
  const sorted = [...providers];

  if (preferences.priority === 'price') {
    sorted.sort((a, b) => {
      const ca = getAnnualCostForSort(a, providerPrices, consumptionKwhPerYear);
      const cb = getAnnualCostForSort(b, providerPrices, consumptionKwhPerYear);
      if (ca !== cb) return ca - cb;
      return a.display_order - b.display_order;
    });
  } else if (preferences.priority === 'security') {
    const established = ['Tibber', 'Fortum', 'Eon', 'E.ON', 'Vattenfall'];
    const isEst = (n: string) =>
      established.includes(n) || established.some((e) => e.toLowerCase() === n.toLowerCase());
    sorted.sort((a, b) => {
      const aEstablished = isEst(a.name);
      const bEstablished = isEst(b.name);
      if (aEstablished && !bEstablished) return -1;
      if (!aEstablished && bEstablished) return 1;
      return a.display_order - b.display_order;
    });
  } else if (preferences.priority === 'flexibility') {
    sorted.sort((a, b) => {
      const ra = flexibilityRank(a.name);
      const rb = flexibilityRank(b.name);
      if (ra !== rb) return ra - rb;
      return a.display_order - b.display_order;
    });
  }

  return sorted;
}

export default function RorligtAvtalV2Page() {
  usePageView('/rorligt-avtal-v2');

  const [step, setStep] = useState<'questions' | 'results'>('questions');
  const [providers, setProviders] = React.useState<PageProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [failedLogos, setFailedLogos] = React.useState<Set<number>>(new Set());
  const [providerPrices, setProviderPrices] = React.useState<ProviderPricesMap | null>(null);
  const [priceArea, setPriceArea] = React.useState<ElectricityArea>('se3');
  const [consumptionKwhPerYear, setConsumptionKwhPerYear] = React.useState(5000);
  const [showAllProviders, setShowAllProviders] = useState(false);

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
            const description = resolveRorligtDescription(provider, fallbackProvider);
            return {
              ...provider,
              description,
              logo_url: logoUrl,
              best_price_badge_text:
                provider.best_price_badge_text && provider.best_price_badge_text.trim() !== ''
                  ? provider.best_price_badge_text
                  : undefined,
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

  // Hämta prisdata (månadskostnad + påslag) baserat på elområde och årsförbrukning
  React.useEffect(() => {
    let cancelled = false;
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
      }
    };
    fetchProviderPrices();
    return () => { cancelled = true; };
  }, [priceArea, consumptionKwhPerYear]);

  // Justera elområde utifrån postnummer när användaren fyller i det
  React.useEffect(() => {
    const postal = preferences.postalCode?.replace(/\D/g, '');
    if (postal && postal.length === 5) {
      try {
        const area = getElectricityArea(postal);
        setPriceArea(area);
      } catch {
        // behåll nuvarande area
      }
    }
  }, [preferences.postalCode]);

  // Använd användarens årsförbrukning för prisberäkning om den finns
  React.useEffect(() => {
    if (preferences.annualUsage && preferences.annualUsage > 0) {
      setConsumptionKwhPerYear(preferences.annualUsage);
    }
  }, [preferences.annualUsage]);

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
      setStep('results');
    }
  };

  const handleSkipToResults = () => {
    setPreferences((prev) => ({
      ...DEFAULT_SKIP_PREFERENCES,
      ...prev,
      annualUsage: prev.annualUsage || DEFAULT_SKIP_PREFERENCES.annualUsage,
      priority: prev.priority || DEFAULT_SKIP_PREFERENCES.priority,
    }));
    setConsumptionKwhPerYear(
      preferences.annualUsage && preferences.annualUsage > 0
        ? preferences.annualUsage
        : DEFAULT_SKIP_PREFERENCES.annualUsage!
    );
    setStep('results');
  };

  const handleProviderClick = (providerName: string, url: string) => {
    try {
      // Generera unikt tracking-ID för att koppla försäljningar till klick
      const trackingId = `elchef_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const sessionId = getOrCreateSessionId();
      const heroVariant = typeof window !== 'undefined' ? window.localStorage.getItem('hero_variant_v1') || null : null;
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
          heroVariant,
          source: 'rorligt-avtal-v2',
          preferences: {
            ...preferences,
            experimentId: CONVERSION_EXPERIMENT.id,
          },
          trackingId
        }),
        keepalive: true,
      }).catch(() => {});

      // Lägg till tracking-ID i affiliate-länken
      const urlWithTracking = url.includes('?') 
        ? `${url}&elchef_ref=${encodeURIComponent(trackingId)}`
        : `${url}?elchef_ref=${encodeURIComponent(trackingId)}`;

      openAffiliateUrl(urlWithTracking);

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

  const recommendedProviders = React.useMemo(
    () =>
      step === 'results'
        ? getRecommendedProviders(providers, preferences, providerPrices, consumptionKwhPerYear)
        : providers,
    [step, providers, preferences, providerPrices, consumptionKwhPerYear]
  );
  const featuredProvider = recommendedProviders[0] ?? null;
  const otherProviders = recommendedProviders.slice(1);
  const progress = step === 'questions' ? 50 : 100;

  const renderProviderCard = (provider: PageProvider, index: number, featured: boolean) => {
    const fromApi = getProviderPriceFromApi(provider.name, providerPrices);
    const månadKr = fromApi?.monthly_fee_kr ?? provider.manual_monthly_fee_kr ?? getMånadskostnadKr(provider.name);
    const påslagValue = fromApi?.surcharge_ore_per_kwh ?? provider.manual_surcharge_ore_per_kwh ?? getPåslagÖrePerKwh(provider.name);
    const rateLabel = fromApi?.rate_type === 'monthly'
      ? 'Rörligt månadspris'
      : provider.manual_rate_type === 'monthly'
        ? 'Rörligt månadspris'
        : provider.manual_rate_type === 'quarterly'
          ? 'Rörligt kvartspris'
          : 'Rörligt timpris';
    const påslagText =
      påslagValue === 0
        ? '0 öre/kWh i påslag'
        : påslagValue < 0
          ? `${påslagValue.toLocaleString('sv-SE')} öre/kWh i påslag (minuspåslag)`
          : `${påslagValue.toLocaleString('sv-SE')} öre/kWh i påslag`;

    const customBadge = provider.best_price_badge_text && provider.best_price_badge_text.trim() !== ''
      ? provider.best_price_badge_text
      : null;
    const showBestForYou = featured || index === 0;
    const showPriceBadge = !customBadge && showBestForYou && preferences.priority === 'price';

    return (
      <ProviderCard key={provider.id} recommended={featured || index === 0}>
        <CardShimmerLayer />
        {customBadge && <BestPriceBadge>{customBadge}</BestPriceBadge>}
        {showPriceBadge && <BestPriceBadge>Billigast just nu</BestPriceBadge>}
        {!customBadge && !showPriceBadge && showBestForYou && (
          <RecommendedBadge>⭐ Bäst för dig</RecommendedBadge>
        )}
        {!customBadge && !showPriceBadge && !showBestForYou && provider.is_recommended && (
          <RecommendedBadge>⭐ Rekommenderat idag</RecommendedBadge>
        )}
        {provider.logo_url && provider.logo_url.trim() !== '' && !failedLogos.has(provider.id) && (
          <ProviderLogo
            src={provider.logo_url}
            alt={provider.name}
            onError={() => {
              setFailedLogos((prev) => new Set(prev).add(provider.id));
            }}
          />
        )}
        <ProviderName>{provider.name}</ProviderName>
        {SOLAR_PROVIDERS.has(provider.name) && (
          <ProviderTag>☀️ Extra bra för dig med solceller eller batteri</ProviderTag>
        )}
        <PriceBlock>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>{rateLabel}</span>
          <span>{månadKr === 0 ? '0 kr/månad' : `${månadKr} kr/månad`}</span>
          <span>{påslagText}</span>
        </PriceBlock>
        {provider.campaign_text && typeof provider.campaign_text === 'string' && (
          <div
            style={{
              fontWeight: provider.campaign_bold ? 'bold' : 'normal',
              fontStyle: provider.campaign_italic ? 'italic' : 'normal',
              fontSize: '0.9rem',
              color: '#6b7280',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {String(provider.campaign_text)}
          </div>
        )}
        <ProviderDescription>{provider.description || ''}</ProviderDescription>
        <ProviderButtonRow>
          <ProviderButton
            href={provider.url}
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleProviderClick(provider.name, provider.url);
            }}
          >
            {PROVIDER_CTA_LABELS[provider.name] ?? `Teckna hos ${provider.name} – tar ~2 min`}
          </ProviderButton>
        </ProviderButtonRow>
      </ProviderCard>
    );
  };

  return (
    <PageContainer>
      <Content>
        <Title>Hitta rätt elavtal för dig</Title>
        <Subtitle>
          Vi hjälper dig hitta en leverantör som passar – svara på två frågor eller hoppa direkt till avtalen.
        </Subtitle>

        <ProgressBar progress={progress} />

        {step === 'questions' ? (
          <StepContainer>
            <QuestionTitle>Berätta lite om dina preferenser</QuestionTitle>
            <QuestionText>
              Svara på två frågor så visar vi det avtal som passar dig bäst först. Du kan alltid hoppa över.
            </QuestionText>

            <InputGroup>
              <Label>Ungefärlig årsförbrukning (kWh/år) *</Label>
              <Input
                type="number"
                placeholder="t.ex. 5000"
                value={preferences.annualUsage || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, annualUsage: parseInt(e.target.value) || undefined })
                }
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
            <SkipButton type="button" onClick={handleSkipToResults}>
              Hoppa över – visa avtal direkt
            </SkipButton>
          </StepContainer>
        ) : (
          <StepContainer>
            <QuestionTitle>Vårt tips till dig</QuestionTitle>
            <QuestionText>
              Börja med rekommendationen nedan – tecknandet tar oftast bara ett par minuter.
              {preferences.priority === 'price' &&
                ' Sorterat efter lägst beräknad årskostnad utifrån din förbrukning.'}
              {preferences.priority === 'security' && ' Sorterat med fokus på etablerade leverantörer.'}
              {preferences.priority === 'flexibility' &&
                ' Sorterat med fokus på flexibla villkor – kontrollera alltid exakta villkor hos leverantören.'}
            </QuestionText>

            <TrustSection>
              <TrustBadge>✓ 100% säkert – du betalar bara till det nya elbolaget</TrustBadge>
              <TrustBadge>✓ Din gamla elavtal sägs upp automatiskt vid bytet</TrustBadge>
              <TrustBadge>✓ De flesta avtal har 0–3 månaders uppsägningstid</TrustBadge>
              <TrustBadge>✓ Vi hjälper dig om något känns oklart</TrustBadge>
            </TrustSection>

            {loading ? (
              <div style={{ textAlign: 'center', color: '#374151', padding: '2rem' }}>
                Laddar leverantörer...
              </div>
            ) : (
              <>
                {featuredProvider && (
                  <FeaturedCardWrap>{renderProviderCard(featuredProvider, 0, true)}</FeaturedCardWrap>
                )}

                {otherProviders.length > 0 && !showAllProviders && (
                  <ShowMoreButton type="button" onClick={() => setShowAllProviders(true)}>
                    Visa {otherProviders.length} fler alternativ
                  </ShowMoreButton>
                )}

                {showAllProviders && otherProviders.length > 0 && (
                  <ProvidersGrid>
                    {otherProviders.map((provider, i) => renderProviderCard(provider, i + 1, false))}
                  </ProvidersGrid>
                )}
              </>
            )}

            <FastprisCta href="/fastpris-avtal">
              Vill du hellre binda priset?
              <span>Se fastprisavtal →</span>
            </FastprisCta>

            <div
              style={{
                marginTop: '2rem',
                background: '#f9fafb',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                }}
              >
                Vanliga frågor innan du byter
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  color: '#374151',
                  fontSize: '0.95rem',
                  display: 'grid',
                  gap: '0.5rem',
                }}
              >
                <li>
                  <strong>Vilket avtal passar mig?</strong> Vi lyfter det alternativ som bäst matchar
                  dina svar – du kan alltid jämföra fler.
                </li>
                <li>
                  <strong>Hur fungerar bytet?</strong> Ditt nuvarande avtal sägs normalt upp
                  automatiskt. Elen fortsätter fungera som vanligt.
                </li>
                <li>
                  <strong>Är det bindningstid?</strong> Många avtal har ingen bindningstid och 0–3
                  månaders uppsägningstid. Det står hos leverantören innan du bekräftar.
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowAllProviders(false);
                  setStep('questions');
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid #e5e7eb',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                }}
              >
                ← Ändra mina svar
              </button>
            </div>
          </StepContainer>
        )}
      </Content>
      {step === 'results' && <SafeBottomSpacer />}
    </PageContainer>
  );
}
