"use client";

import { useState } from 'react';
import GlassButton from '@/components/GlassButton';
import { withDefaultCtaUtm } from '@/lib/utm';
import { fetchCheapEnergyPrices } from '@/lib/priceService';
import type { CheapEnergyPrices, ElectricityArea } from '@/lib/types';
import { getElectricityArea } from '@/lib/types';

export default function ElpriskollenPage() {
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState<ElectricityArea | null>(null);
  const [prices, setPrices] = useState<CheapEnergyPrices | null>(null);
  const [priceStatus, setPriceStatus] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'invalid_postal'>('idle');
  const [priceError, setPriceError] = useState<string | null>(null);

  const formatFixedPrice = (value: unknown): string => {
    if (typeof value === 'number') {
      return `${value} öre/kWh`;
    }
    if (value && typeof value === 'object') {
      const anyVal = value as { value?: number; price?: number };
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
  };

  const handlePostalSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const trimmed = postalCode.replace(/\s/g, '');
    if (!/^\d{5}$/.test(trimmed)) {
      setPriceStatus('invalid_postal');
      setPriceError('Skriv ett giltigt postnummer med 5 siffror.');
      setArea(null);
      return;
    }

    try {
      setPriceStatus('loading');
      setPriceError(null);

      const elArea = getElectricityArea(trimmed);
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
      console.error('Error when looking up prices by postal code on elpriskollen:', error);
      setPriceStatus('error');
      setPriceError(
        'Kunde inte hämta aktuella priser just nu. Prova igen senare eller ladda upp din elräkning för en exakt analys.'
      );
    }
  };

  return (
    <main className="container" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--section-spacing) 0' }}>
      <section
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2.5rem',
          boxShadow: 'var(--glass-shadow-medium)',
          marginBottom: '2rem',
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            Elpriskollen – se ditt elområde och prisnivå
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            Skriv in ditt postnummer och se ungefärliga nivåer för rörligt pris och fastpris just nu i ditt elområde
            (SE1–SE4). Perfekt som första koll innan du analyserar din elräkning eller byter avtal.
          </p>
        </header>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: 16,
            padding: '1.5rem 1.75rem',
            border: '1px solid rgba(148, 163, 184, 0.6)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
          }}
        >
          <form
            onSubmit={handlePostalSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <label
              htmlFor="elpriskollen-postal"
              style={{ fontSize: '0.95rem', color: 'rgba(226, 232, 240, 0.95)', fontWeight: 500 }}
            >
              Ange ditt postnummer:
            </label>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'nowrap',
              }}
            >
              <input
                id="elpriskollen-postal"
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
                Visa prisnivå
              </button>
            </div>
          </form>

          <div style={{ marginTop: '0.9rem', fontSize: '0.9rem', color: 'rgba(226,232,240,0.9)' }}>
            {priceStatus === 'idle' && (
              <span>Vi använder ditt postnummer för att koppla dig till rätt elområde (SE1–SE4).</span>
            )}
            {priceStatus === 'invalid_postal' && (
              <span style={{ color: '#fecaca' }}>Ogiltigt postnummer. Skriv fem siffror, t.ex. 11122.</span>
            )}
            {priceStatus === 'loading' && <span>Hämtar aktuella priser för ditt elområde…</span>}
            {priceStatus === 'error' && priceError && <span style={{ color: '#fecaca' }}>{priceError}</span>}
            {priceStatus === 'loaded' && prices && area && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                <strong>
                  I ditt område ({area.toUpperCase()}): ungefärliga prisnivåer just nu
                </strong>
                <span>
                  Rörligt pris (spot):{' '}
                  <strong>
                    ca {Math.round((prices.spot_prices[area] ?? 0) * 10) / 10} öre/kWh
                  </strong>
                </span>
                <span>
                  Fastpris 6 mån:{' '}
                  <strong>{formatFixedPrice(prices.variable_fixed_prices[area]?.['6_months'])}</strong>, 12 mån:{' '}
                  <strong>{formatFixedPrice(prices.variable_fixed_prices[area]?.['1_year'])}</strong>
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Dessa nivåer är ungefärliga. För en mer exakt bild av dina faktiska kostnader kan du ladda upp din
                  elräkning eller gå vidare till byte av elavtal.
                </span>
              </div>
            )}
          </div>
        </div>

        <section
          aria-label="Nästa steg efter Elpriskollen"
          style={{
            marginTop: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            fontSize: '0.95rem',
            color: 'rgba(248, 250, 252, 0.95)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.3rem',
                marginBottom: '0.5rem',
                color: 'white',
              }}
            >
              Vad gör jag efter Elpriskollen?
            </h2>
            <p style={{ margin: 0 }}>
              Elpriskollen ger dig en snabb känsla för om dina priser ligger rimligt till. Vill du se din riktiga
              besparingspotential kan du:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: 14,
                padding: '1.1rem 1.25rem',
                border: '1px solid rgba(148, 163, 184, 0.7)',
                boxShadow: '0 16px 40px rgba(15,23,42,0.55)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  margin: '0 0 0.4rem 0',
                  color: 'white',
                }}
              >
                1. Ladda upp din elräkning
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(226,232,240,0.95)',
                }}
              >
                Med{' '}
                <a
                  href={withDefaultCtaUtm(
                    `/fakturaanalys${postalCode ? `?postal=${postalCode}` : ''}`,
                    'elpriskollen',
                    'step-fakturaanalys'
                  )}
                  style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                >
                  fakturaanalys med AI
                </a>{' '}
                läser vi av alla avgifter och räknar ut hur mycket du faktiskt kan spara.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: 14,
                padding: '1.1rem 1.25rem',
                border: '1px solid rgba(148, 163, 184, 0.7)',
                boxShadow: '0 16px 40px rgba(15,23,42,0.55)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  margin: '0 0 0.4rem 0',
                  color: 'white',
                }}
              >
                2. Byt till ett bättre elavtal
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(226,232,240,0.95)',
                }}
              >
                När du vet hur dina priser ligger till kan du gå vidare till{' '}
                <a
                  href={withDefaultCtaUtm('/byt-elavtal', 'elpriskollen', 'step-byt-elavtal')}
                  style={{ color: '#bfdbfe', textDecoration: 'underline' }}
                >
                  Byt elavtal
                </a>{' '}
                och låta oss hjälpa dig genom bytet – enkelt och tryggt.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a
              href={withDefaultCtaUtm(
                `/fakturaanalys${postalCode ? `?postal=${postalCode}` : ''}`,
                'elpriskollen',
                'cta-fakturaanalys'
              )}
              style={{ textDecoration: 'none' }}
            >
              <GlassButton
                variant="primary"
                size="lg"
                background="linear-gradient(135deg, var(--primary), var(--secondary))"
                disableScrollEffect
                disableHoverEffect
              >
                Gå vidare till fakturaanalys med AI
              </GlassButton>
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}