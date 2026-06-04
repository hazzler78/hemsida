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

const WeatherList = styled.ul`
  margin: 1.5rem 0;
  padding: 0;
  list-style: none;
`;

const WeatherListItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.7;
  padding: 1rem;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 8px;
  border-left: 3px solid var(--primary);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(248, 250, 252, 1);
    transform: translateX(4px);
  }
`;

const VideoBox = styled.div`
  background: rgba(236,245,255,0.7);
  border-radius: var(--radius-md);
  padding: 1.2rem;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0,106,167,0.12);
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

const InfoBox = styled.div`
  background: linear-gradient(120deg, var(--primary) 60%, var(--primary-dark) 100%);
  color: white;
  box-shadow: var(--glass-shadow-heavy);
  border: 1.5px solid rgba(255,255,255,0.18);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  margin: 2rem 0;
  
  h4 {
    margin-bottom: 1rem;
    color: white;
  }
`;

const Quote = styled.blockquote`
  font-style: italic;
  color: var(--primary-dark);
  border-left: 4px solid var(--primary);
  padding: 1.5rem;
  margin: 2rem 0;
  font-weight: 500;
  background: linear-gradient(135deg, rgba(0,106,167,0.05), rgba(254,204,0,0.05));
  border-radius: 12px;
  font-size: 1.1rem;
  line-height: 1.6;
  position: relative;
  
  &::before {
    content: '"';
    font-size: 3rem;
    color: var(--primary);
    position: absolute;
    top: -0.5rem;
    left: 1rem;
    opacity: 0.3;
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

export default function WeatherElectricityPrices() {
  return (
    <PageBackground>
      <Section>
        <Container>
          <BackButton href="/media">
            <BackIcon />
            Tillbaka till Elchef i media
          </BackButton>
          
          <Title>Så påverkar vädret elpriset – förklarat på ett enkelt sätt</Title>
          <Lead>
            Elpriset svänger hela tiden – och vädret är en av de viktigaste faktorerna. På sommaren är priserna ofta lägre, men variationerna styrs ändå av regn, vind och temperatur.
          </Lead>

          <Article>
            <VideoBox>
              <p>
                I det här klippet från <b>Tidslinjen Podcast</b> får du en lättförståelig genomgång:
              </p>
              <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
                <iframe
                  src="https://www.youtube.com/embed/upV45wGq1xM"
                  title="Tidslinjen Podcast - Elpris"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                ></iframe>
              </div>
            </VideoBox>
            
            <SubTitle>Kort – så styr vädret elpriset:</SubTitle>
            <WeatherList>
              <WeatherListItem>
                <ArrowRight />
                <div>
                  <strong>Regn → lägre pris</strong><br />
                  <span style={{color: 'var(--gray-600)', fontSize: '0.95rem'}}>Fyller vattenmagasin i norr – billig vattenkraft</span>
                </div>
              </WeatherListItem>
              <WeatherListItem>
                <ArrowRight />
                <div>
                  <strong>Vind → lägre pris</strong><br />
                  <span style={{color: 'var(--gray-600)', fontSize: '0.95rem'}}>Mycket vindkraftproduktion pressar priset</span>
                </div>
              </WeatherListItem>
              <WeatherListItem>
                <ArrowRight />
                <div>
                  <strong>Värme → ofta lägre pris</strong><br />
                  <span style={{color: 'var(--gray-600)', fontSize: '0.95rem'}}>Mindre efterfrågan på uppvärmning</span>
                </div>
              </WeatherListItem>
              <WeatherListItem style={{borderLeftColor: '#ef4444'}}>
                <ArrowRight />
                <div>
                  <strong>Torka eller vindstilla → högre pris</strong><br />
                  <span style={{color: 'var(--gray-600)', fontSize: '0.95rem'}}>Mindre billig el – vi importerar dyrare el</span>
                </div>
              </WeatherListItem>
            </WeatherList>
            
            <Quote>
              Tänk på rörligt elpris som bensinpriset – det varierar med tillgång och efterfrågan.
            </Quote>
            
            <SubTitle>Sommaren är perfekt för att säkra ett bra elavtal</SubTitle>
            <CustomList>
              <CustomListItem>
                <CheckIcon />
                <div>Många vill låsa in låga sommarpriser inför hösten.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div>Hos oss elchef.se får du rörligt pris utan påslag – bara marknadspriset.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div>Vi visar även fasta elavtal för dig som vill slippa prischocker.</div>
              </CustomListItem>
            </CustomList>
            
            <InfoBox>
              <h4>Bytet är alltid gratis och enkelt:</h4>
              <CustomList>
                <CustomListItem>
                  <CheckIcon />
                  <div>Helt digitalt.</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Vi fixar uppsägningen hos ditt gamla elbolag.</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Inga papper eller samtal.</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Klart på 14 dagar.</div>
                </CustomListItem>
              </CustomList>
            </InfoBox>
            
            <div style={{ textAlign: 'center' }}>
              <CTAButton 
                href="https://www.elchef.se" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Redo att fixa bästa elavtalet? Byt direkt på elchef.se <ArrowIcon />
              </CTAButton>
            </div>
          </Article>
        </Container>
      </Section>
    </PageBackground>
  );
}
