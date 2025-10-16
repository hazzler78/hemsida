"use client";

import styled from 'styled-components';
import React from 'react';
import Link from 'next/link';

// Eleganta ikoner
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{marginRight: 12, flexShrink: 0, marginTop: 2}}>
    <polyline points="3,9 7,13 13,5" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" style={{marginRight: 8, flexShrink: 0, marginTop: 2}}>
    <path d="M6 4l4 4-4 4" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const NewspaperIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{marginRight: 10, flexShrink: 0, verticalAlign: 'middle'}}>
    <rect x="3" y="5" width="18" height="14" rx="3" fill="var(--primary)"/>
    <rect x="6" y="8" width="8" height="2" rx="1" fill="#fff"/>
    <rect x="6" y="12" width="5" height="2" rx="1" fill="#fff"/>
    <rect x="13" y="12" width="5" height="2" rx="1" fill="#fff"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginLeft: 10, flexShrink: 0, verticalAlign: 'middle'}}>
    <path d="M7 5l5 5-5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{marginRight: 8, flexShrink: 0}}>
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Section = styled.section`
  padding: var(--section-spacing) 0;
  background: transparent;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255,255,255,0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow-light);
  padding: 3rem 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 2rem;
  transition: color 0.2s;
  
  &:hover {
    color: var(--primary-dark);
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  color: var(--primary);
`;

const Lead = styled.p`
  font-size: 1.2rem;
  color: var(--gray-700);
  margin-bottom: 2rem;
`;

const Article = styled.article`
  margin-top: 2rem;
`;

const CustomList = styled.ul`
  margin: 1.5rem 0;
  padding: 0;
  list-style: none;
`;

const CustomListItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.2rem;
  font-size: 1.1rem;
  line-height: 1.7;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SubTitle = styled.h3`
  font-size: 1.3rem;
  margin: 2.5rem 0 1.5rem 0;
  color: var(--primary-dark);
  font-weight: 700;
  position: relative;
  padding-bottom: 0.5rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    border-radius: 2px;
  }
`;

const VideoBox = styled.div`
  background: rgba(236,245,255,0.7);
  border-radius: var(--radius-md);
  padding: 1.2rem;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0,106,167,0.12);
`;

const HallandspostenLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
  
  &:hover {
    color: var(--primary-dark);
    text-decoration: underline;
  }
`;


const CTAButton = styled.a`
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  font-size: 1.1rem;
  padding: 1rem 2rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 700;
  box-shadow: var(--glass-shadow-light);
  text-decoration: none;
  display: inline-block;
  margin-top: 1.5rem;
  
  &:hover {
    background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
    transform: translateY(-2px) scale(1.03);
    box-shadow: var(--glass-shadow-heavy);
  }
`;

const PageBackground = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(120deg, rgba(0,106,167,0.10) 0%, rgba(254,204,0,0.10) 100%);
  padding: 0;
`;

export default function RobinHoodElectricity() {
  return (
    <PageBackground>
      <Section>
        <Container>
          <BackButton href="/media">
            <BackIcon />
            Tillbaka till Elchef i media
          </BackButton>
          
          <Title>Elens Robin Hood vill ha billigare el åt folket</Title>
          <Lead>
            Många är trötta på krångliga elavtal, dolda avgifter och dyra mellanhänder. I den här artikeln i Hallandsposten berättar Mathias Nilsson om sin plan: att <b>göra elmarknaden mer rättvis och ge billigare el åt alla</b>.
          </Lead>

          <Article>
            <VideoBox>
              <HallandspostenLink
                href="https://www.hallandsposten.se/hallands-affarer/han-vill-ha-billigare-el-at-folket.857df3f6-83cd-495c-b0bb-8f44359758e3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <NewspaperIcon />
                Läs artikeln i Hallandsposten
              </HallandspostenLink>
            </VideoBox>
            
            <SubTitle>Elchef.se vill göra skillnad:</SubTitle>
            <CustomList>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Inga dolda påslag eller avgifter</strong> – du ser det riktiga priset.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Full valfrihet</strong> – välj mellan rörligt el eller fast pris på ett ställe.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Vi sköter allt åt dig</strong> – smidigt och enkelt.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Transparens och enkelhet</strong> – så att alla kan fatta bra beslut.</div>
              </CustomListItem>
            </CustomList>
            
            <SubTitle>Sommaren – bästa tiden att byta elavtal</SubTitle>
            <p>
              Just nu är elpriserna ofta lägre tack vare:
            </p>
            <CustomList>
              <CustomListItem>
                <ArrowRight />
                <div>Fyllda vattenmagasin efter vårfloden.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div>Mycket vindkraftproduktion.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div>Lägre efterfrågan på uppvärmning.</div>
              </CustomListItem>
            </CustomList>
            
            <p>
              Smart att teckna rörligt pris till sommarprisnivå.<br />
              Eller välja fast pris och slippa höstrusket i plånboken.
            </p>
            
            <SubTitle>Därför ska du byta med elchef.se</SubTitle>
            <CustomList>
              <CustomListItem>
                <CheckIcon />
                <div>Helt digitalt – inga papper eller samtal.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div>Vi säger upp ditt gamla avtal åt dig.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>14 dagar från signering till start – börja planera redan nu.</strong></div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div>Alltid marknadens bästa översikt – så du slipper leta själv.</div>
              </CustomListItem>
            </CustomList>
            
            <div style={{ textAlign: 'center' }}>
              <CTAButton 
                href="https://elchef.se" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Redo att hitta bästa elavtalet? Byt enkelt på elchef.se <ArrowIcon />
              </CTAButton>
            </div>
          </Article>
        </Container>
      </Section>
    </PageBackground>
  );
}
