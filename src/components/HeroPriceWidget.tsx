/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback } from 'react';
import { withDefaultCtaUtm } from '@/lib/utm';
import { fetchCheapEnergyPrices } from '@/lib/priceService';
import type { CheapEnergyPrices, ElectricityArea } from '@/lib/types';
import { getElectricityArea } from '@/lib/types';
import { ElectricityAreaMap } from './ElectricityAreaMap';

function formatFixedPrice(value: unknown): string {
  if (typeof value === 'number') {
    return `${value} öre/kWh`;
  }
  if (value && typeof value === 'object') {
    const anyVal = value as any;
    const num =
      typeof anyVal.value === 'number'
        ? anyVal.value
        : typeof anyVal.price === 'number'
        ? anyVal.price
        : undefined;
    if (typeof num === 'number') {
      return `${num} öre/kWh`;
    }
  }
  return '—';
}

export default function HeroPriceWidget() {
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState<ElectricityArea | null>(null);
  const [prices, setPrices] = useState<CheapEnergyPrices | null>(null);
  const [priceStatus, setPriceStatus] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'invalid_postal'>('idle');
  const [priceError, setPriceError] = useState<string | null>(null);

  const loadPricesForArea = useCallback(
    async (elArea: ElectricityArea) => {
      try {
        setPriceStatus('loading');
        setPriceError(null);
        setArea(elArea);

        let data = prices;
        if (!data) {
          data = await fetchCheapEnergyPrices();
          setPrices(data);
        }

        if (!data.spot_prices[elArea] && !data.variable_fixed_prices[elArea]) {
          setPriceStatus('error');
          setPriceError('Kunde inte hitta prisdata för ditt område just nu.');
          return;
        }

        setPriceStatus('loaded');
      } catch (error) {
        console.error('Error when looking up prices by area:', error);
        setPriceStatus('error');
        setPriceError(
          'Kunde inte hämta aktuella priser just nu. Försök igen senare eller ladda upp din elräkning för en exakt analys.'
        );
      }
    },
    [prices]
  );

  const handlePostalSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();
      const trimmed = postalCode.replace(/\s/g, '');
      if (!/^\d{5}$/.test(trimmed)) {
        setPriceStatus('invalid_postal');
        setPriceError('Skriv ett giltigt postnummer med 5 siffror.');
        setArea(null);
        return;
      }

      const elArea = getElectricityArea(trimmed);
      await loadPricesForArea(elArea);
    },
    [postalCode, loadPricesForArea]
  );

  const handleAreaClick = useCallback(
    async (selectedArea: ElectricityArea) => {
      await loadPricesForArea(selectedArea);
    },
    [loadPricesForArea]
  );

  return (
    <section
      style={{
        padding: '2rem 0 0',
      }}
    >
      <div className="container">
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 18,
            padding: '1.5rem 1.5rem 1.75rem',
            border: '1px solid rgba(148, 163, 184, 0.6)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
          }}
        >
          <h2
            style={{
              color: 'white',
              marginBottom: '0.75rem',
              fontSize: '1.3rem',
            }}
          >
            Se ungefärliga elpriser i ditt område
          </h2>
          <p
            style={{
              color: 'rgba(226, 232, 240, 0.9)',
              marginBottom: '1rem',
              fontSize: '0.95rem',
            }}
          >
            Skriv ditt postnummer eller klicka direkt på kartan för att se prisnivåer där du bor.
          </p>
          <form
            onSubmit={handlePostalSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <input
                id="hero-postal"
                inputMode="numeric"
                pattern="\d*"
                maxLength={5}
                value={postalCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '').slice(0, 5);
                  setPostalCode(value);
                  if (priceStatus !== 'idle') {
                    setPriceStatus('idle');
                    setPriceError(null);
                  }
                }}
                onBlur={() => {
                  if (postalCode.replace(/\s/g, '').length === 5) {
                    void handlePostalSubmit();
                  }
                }}
                placeholder="t.ex. 11122"
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 9999,
                  border: '1px solid rgba(148, 163, 184, 0.8)',
                  padding: '0.6rem 0.9rem',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                aria-label="Postnummer"
              />
              <button
                type="submit"
                style={{
                  borderRadius: 9999,
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'white',
                  whiteSpace: 'nowrap',
                }}
              >
                Visa pris
              </button>
            </div>
          </form>

          <div style={{ marginTop: '1rem' }}>
            <ElectricityAreaMap onAreaSelected={handleAreaClick} value={area} />
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9rem',
              color: 'rgba(226,232,240,0.9)',
            }}
          >
            {priceStatus === 'idle' && (
              <span>Exakt pris visas efter att du har fyllt i ditt postnummer eller valt elområde.</span>
            )}
            {priceStatus === 'invalid_postal' && (
              <span style={{ color: '#fecaca' }}>Ogiltigt postnummer. Skriv fem siffror, t.ex. 11122.</span>
            )}
            {priceStatus === 'loading' && <span>Hämtar aktuella priser för ditt elområde…</span>}
            {priceStatus === 'error' && priceError && <span style={{ color: '#fecaca' }}>{priceError}</span>}
            {priceStatus === 'loaded' && prices && area && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <strong>I ditt område ({area.toUpperCase()}): ungefärliga prisnivåer just nu</strong>
                <span>
                  Rörligt pris (spot):{' '}
                  <strong>{`ca ${Math.round((prices.spot_prices[area] ?? 0) * 10) / 10}`}</strong> öre/kWh
                </span>
                <span>
                  Fastpris 6 mån:{' '}
                  <strong>{formatFixedPrice(prices.variable_fixed_prices[area]?.['6_months'])}</strong>, 12 mån:{' '}
                  <strong>{formatFixedPrice(prices.variable_fixed_prices[area]?.['1_year'])}</strong>
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Priserna är ungefärliga och kan variera beroende på förbrukning och val av elavtal. För en mer exakt
                  genomgång kan du{' '}
                  <a
                    href={withDefaultCtaUtm(
                      `/jamfor-elpriser${postalCode ? `?postal=${postalCode}` : ''}`,
                      'hero',
                      'postal-prices-ai'
                    )}
                    style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                  >
                    ladda upp din elräkning
                  </a>{' '}
                  eller gå vidare till{' '}
                  <a
                    href={withDefaultCtaUtm('/byt-elavtal', 'hero', 'postal-prices-switch')}
                    style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                  >
                    Byt elavtal
                  </a>
                  .
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

