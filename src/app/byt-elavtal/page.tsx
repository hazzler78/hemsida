"use client";

import React from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import GlassButton from '@/components/GlassButton';

/* ---------- Design-tokens -------------------------------------------------
   En yta för alla rutor på sidan. Tidigare hade avtalskorten egna värden
   (15px radie, 0.9 bakgrund, 24px padding, annan skugga) vilket gjorde sidan
   oenhetlig — och checklistan saknade marginal så den klistrade mot korten.
   Ändra här, slår igenom överallt.
-------------------------------------------------------------------------- */
const RADIUS = '20px';
const GAP = '2rem';

const surface = css`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: ${RADIUS};
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.35);
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
`;

/* flex-kolumn med gap -> exakt samma avstand mellan alla block,
   inga marginalkollapser (som var det som gjorde att rutorna klistrade) */
const Content = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${GAP};
`;

const Header = styled.div`
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    font-size: 1.3rem;
  }
`;

const InfoSection = styled.div`
  ${surface}
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 1rem;
  text-align: center;
`;

const InfoText = styled.p`
  color: #374151;
  line-height: 1.65;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NextSteps = styled.div`
  ${surface}
`;

const NextStepsList = styled.ol`
  color: #374151;
  text-align: left;
  max-width: 520px;
  margin: 0 auto;
  padding-left: 1.25rem;

  li {
    margin-bottom: 0.6rem;
    line-height: 1.6;
  }

  li:last-child {
    margin-bottom: 0;
  }

  li strong {
    color: #111827;
  }
`;

const NextStepsNote = styled.p`
  color: #6b7280;
  text-align: center;
  max-width: 520px;
  margin: 1.5rem auto 0;
  font-size: 0.95rem;
  line-height: 1.6;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${GAP};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

/* korten anvander samma yta som ovriga rutor — och rymmer nu sin egen knapp
   sa att kortet ar en enhet istallet for att knapparna ligger losa under */
const ContractCard = styled.div`
  ${surface}
  display: flex;
  flex-direction: column;
  text-align: center;
`;

const ContractTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.75rem;
`;

const ContractDescription = styled.p`
  color: #374151;
  margin-bottom: 0.5rem;
  line-height: 1.6;
`;

const ContractFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
`;

const FeatureItem = styled.li`
  color: #374151;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  line-height: 1.45;

  &::before {
    content: "✓";
    color: #22c55e;
    font-weight: bold;
    flex-shrink: 0;
  }
`;

/* knappen skjuts ned till kortets botten sa bada korten linjerar,
   aven nar texten ar olika lang */
const CardAction = styled.div`
  margin-top: auto;
  padding-top: 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const ButtonLabel = styled.div`
  font-size: 0.9rem;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  text-align: center;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
`;

const RorligtLabel = styled(ButtonLabel)`
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
  color: #15803d;
`;

const FastprisLabel = styled(ButtonLabel)`
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.25);
  color: #1d4ed8;
`;

export default function BytElavtal() {
  const handleRorligtClick = () => {
    window.location.href = '/rorligt-avtal-v2';
  };

  const handleFastprisClick = () => {
    window.location.href = '/fastpris-avtal';
  };

  return (
    <PageContainer>
      <Content>
        <Header>
          <Title>Välj ditt nya elavtal</Title>
          <Subtitle>Jämför rörligt och fastpris – välj det som passar dig bäst</Subtitle>
        </Header>

        <InfoSection>
          <SectionTitle>Vad händer härnäst?</SectionTitle>
          <InfoText>
            Bytet görs hos det nya bolaget och tar ungefär fem minuter — du fyller i
            dina uppgifter och signerar med BankID. Vi hjälper dig sedan att byta
            avtal till det bästa priset på marknaden.
          </InfoText>
          <InfoText>
            Bor du i lägenhet? Läs först vår guide om{' '}
            <Link href="/kunskap/elavtal-for-lagenhet-sa-valjer-du-ratt" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              elavtal för lägenhet, hyresrätt och bostadsrätt
            </Link>
            {' '}– där går vi igenom månadsavgift och vad som gäller vid inflytt.
          </InfoText>
        </InfoSection>

        <NextSteps>
          <SectionTitle>Det här behöver du ha redo</SectionTitle>
          <NextStepsList>
            <li>Ditt <strong>personnummer</strong></li>
            <li>
              Ditt <strong>anläggnings-ID</strong> — 18 siffror, står på din nätfaktura
              (hos elnätsbolaget, inte elhandlaren). Vet du inte var det finns går det
              att ringa nätägaren och få det.
            </li>
            <li>Din <strong>adress</strong> och kontaktuppgifter</li>
            <li><strong>BankID</strong> för att signera avtalet</li>
            <li>Ungefärlig <strong>årsförbrukning</strong> om du vet den</li>
          </NextStepsList>
          <NextStepsNote>
            Hela bytet tar ungefär fem minuter. Det nya bolaget säger upp ditt gamla
            avtal åt dig — du behöver inte ringa någon. Har du avtal kvar hos det gamla
            bolaget gäller det tills bytet är klart.
          </NextStepsNote>
        </NextSteps>

        <ComparisonGrid>
          <ContractCard>
            <ContractTitle>Rörligt avtal</ContractTitle>
            <ContractDescription>
              Priset följer marknadspriset och kan variera från månad till månad.
              Perfekt om du vill ha flexibilitet och tror att elpriserna kommer att sjunka.
            </ContractDescription>
            <ContractFeatures>
              <FeatureItem>0 kr i avgifter första året</FeatureItem>
              <FeatureItem>Ingen bindningstid</FeatureItem>
              <FeatureItem>Följer marknadspriset</FeatureItem>
              <FeatureItem>Kan spara pengar vid låga priser</FeatureItem>
            </ContractFeatures>
            <CardAction>
              <GlassButton
                variant="primary"
                size="lg"
                onClick={handleRorligtClick}
                background="linear-gradient(135deg, var(--primary), var(--secondary))"
                aria-label="Rörligt avtal - 0 kr i avgifter första året – utan bindningstid"
                disableScrollEffect={true}
                disableHoverEffect={true}
              >
                Välj rörligt avtal
              </GlassButton>
              <RorligtLabel>
                0 kr i avgifter första året – utan bindningstid
              </RorligtLabel>
            </CardAction>
          </ContractCard>

          <ContractCard>
            <ContractTitle>Fastpris avtal</ContractTitle>
            <ContractDescription>
              Du betalar samma pris hela avtalsperioden, oavsett vad som händer på elmarknaden.
              Perfekt om du vill ha förutsägbarhet och tror att elpriserna kommer att stiga.
            </ContractDescription>
            <ContractFeatures>
              <FeatureItem>Fast pris i hela perioden</FeatureItem>
              <FeatureItem>Förutsägbar kostnad</FeatureItem>
              <FeatureItem>Skydd mot prisstegringar</FeatureItem>
              <FeatureItem>Personliga priser baserat på din förbrukning</FeatureItem>
            </ContractFeatures>
            <CardAction>
              <GlassButton
                variant="secondary"
                size="lg"
                onClick={handleFastprisClick}
                background="linear-gradient(135deg, var(--secondary), var(--primary))"
                aria-label="Fastpris - samma elpris under hela avtalstiden"
                disableScrollEffect={true}
                disableHoverEffect={true}
              >
                Välj fastpris avtal
              </GlassButton>
              <FastprisLabel>
                Samma elpris under hela avtalstiden
              </FastprisLabel>
            </CardAction>
          </ContractCard>
        </ComparisonGrid>
      </Content>
    </PageContainer>
  );
}
