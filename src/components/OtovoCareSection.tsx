'use client';

import Link from 'next/link';

export default function OtovoCareSection() {
  return (
    <section className="otovo-care-section">
      <div className="otovo-care-layout">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <img
              src="/otovo-logo.png"
              alt="Otovo"
              style={{
                width: '140px',
                height: 'auto',
                maxWidth: '60%',
              }}
            />
            <span
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.8,
                whiteSpace: 'nowrap',
              }}
            >
              I samarbete med Otovo
            </span>
          </div>
          <p
            style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.85,
              marginBottom: '0.5rem',
            }}
          >
            För dig som redan har solceller
          </p>
          <h2
            style={{
              fontSize: '1.9rem',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '0.75rem',
            }}
          >
            Tryggare solcellsanläggning med Otovo Care
          </h2>
          <p
            style={{
              margin: 0,
              marginTop: '0.5rem',
              marginBottom: '1.25rem',
              fontSize: '0.98rem',
              opacity: 0.9,
              maxWidth: 520,
            }}
          >
            Har du redan solceller på taket? Med Otovo Care får du hjälp med
            felsökning, garantiärenden och uppgraderingar – så att anläggningen
            fortsätter leverera under många år framåt.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              marginBottom: '1.5rem',
              display: 'grid',
              gap: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            <li>✔ Support och felsökning på distans</li>
            <li>✔ Hjälp med garantiärenden mot tillverkare</li>
            <li>✔ 10 % rabatt på inspektioner, reparationer och uppgraderingar</li>
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              href="https://www.otovo.se/partner/elchef_otovocarelp/?utm_source=elchef&utm_medium=web&utm_campaign=otovo_care_home"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.85rem 1.6rem',
                borderRadius: 999,
                border: '1px solid rgba(248, 250, 252, 0.25)',
                background:
                  'linear-gradient(135deg, rgba(248, 250, 252, 0.1), rgba(56, 189, 248, 0.45))',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.7)',
              }}
            >
              Läs mer &amp; starta Otovo Care
            </Link>
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                opacity: 0.8,
                alignSelf: 'center',
              }}
            >
              Du skickas till Otovo.se för registrering
            </p>
          </div>
        </div>
        <div
          style={{
            borderRadius: 16,
            padding: '1.5rem 1.75rem',
            background:
              'radial-gradient(circle at top left, rgba(56,189,248,0.35), transparent 55%), rgba(15,23,42,0.95)',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.7,
              margin: 0,
            }}
          >
            Exempel på lägen
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
            • Du ser lägre produktion än väntat men vet inte varför.{' '}
            <span style={{ opacity: 0.8 }}>
              Otovo kan logga in i din växelriktarportal och hjälpa dig felsöka.
            </span>
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
            • En panel eller växelriktare verkar trasig.{' '}
            <span style={{ opacity: 0.8 }}>
              Du får hjälp att utreda garanti och boka reparation till rabatterat pris.
            </span>
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
            • Du vill uppgradera med batteri eller mer effekt.{' '}
            <span style={{ opacity: 0.8 }}>
              Otovo ger råd och kan installera uppgraderingar.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

