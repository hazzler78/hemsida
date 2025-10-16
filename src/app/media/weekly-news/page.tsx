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

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" style={{marginRight: 8, flexShrink: 0, marginTop: 2}}>
    <path d="M8 1L15 14H1L8 1Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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
  padding-left: 1rem;
  margin: 1.5rem 0;
  font-weight: 600;
  background: rgba(255,255,255,0.6);
  border-radius: 0 12px 12px 0;
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

export default function WeeklyNews() {
  return (
    <PageBackground>
      <Section>
        <Container>
          <BackButton href="/media">
            <BackIcon />
            Tillbaka till Elchef i media
          </BackButton>
          
          <Title>Veckans nyheter från elmarknaden</Title>
          <Lead>
            Här samlar vi de senaste nyheterna och uppdateringarna från elmarknaden som påverkar dig som konsument. Vi håller dig uppdaterad med de viktigaste händelserna som kan påverka ditt elavtal och energianvändning.
          </Lead>

          <Article>
            <SubTitle>Senaste utvecklingar:</SubTitle>
            <CustomList>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Nya elavtal lanseras</strong> – flera leverantörer har justerat sina priser för att konkurrera bättre.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Vindkraftsexpansion</strong> – nya vindkraftsparker planeras vilket kan pressa priserna ytterligare.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Regleringsändringar</strong> – nya EU-direktiv påverkar hur elpriserna ska presenteras för konsumenter.</div>
              </CustomListItem>
              <CustomListItem>
                <WarningIcon />
                <div><strong>Väderprognoser</strong> – kommande veckor förväntas ha blandat väder vilket kan påverka prisvolatiliteten.</div>
              </CustomListItem>
            </CustomList>
            
            <SubTitle>🚨 Varning: Dolda avgifter och orimliga bindningstider</SubTitle>
            <p>
              Vi har upptäckt några riktigt dåliga exempel på hur vissa leverantörer försöker lura kunder:
            </p>
            <CustomList>
              <CustomListItem>
                <WarningIcon />
                <div><strong>Öresundskraft&apos;s &quot;flyttkram&quot;</strong> – 252 kronor bara för att du flyttar in! Vi tackar för skämtet men säger nej tack.</div>
              </CustomListItem>
              <CustomListItem>
                <WarningIcon />
                <div><strong>Lingon&apos;s 60-månaders bindning</strong> – längre än de flesta förhållanden håller! Tur att vi hann rycka in – annars hade det blivit 35 000 kronor i el-sorg.</div>
              </CustomListItem>
            </CustomList>
            
            <Quote>
              &quot;Nu har vi fått fullmakt och laddar pilbågen – pengarna ska tillbaka!&quot;
            </Quote>
            
            <SubTitle>💚 Elchef till undsättning</SubTitle>
            <CustomList>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Inga flyttkramar eller dolda avgifter</strong> – bara marknadens bästa priser.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Inga orimliga bindningstider</strong> – du är fri att byta när du vill.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Personlig hjälp</strong> – lämna ditt telefonnummer så ringer vi upp och hjälper till.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Elens Robin Hood</strong> – vi tar kontakt och hjälper med alla frågor och manuell registrering.</div>
              </CustomListItem>
            </CustomList>
            
            <Quote>
              &quot;Det är viktigt att hålla sig uppdaterad med marknadsutvecklingen för att fatta informerade beslut om ditt elavtal.&quot;
            </Quote>
            
            <SubTitle>Vad betyder detta för dig?</SubTitle>
            <CustomList>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Bättre konkurrens</strong> – fler alternativ och potentiellt lägre priser.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Mer transparens</strong> – tydligare information om vad du faktiskt betalar för.</div>
              </CustomListItem>
              <CustomListItem>
                <CheckIcon />
                <div><strong>Flexibilitet</strong> – möjlighet att byta till bättre avtal när marknaden förändras.</div>
              </CustomListItem>
            </CustomList>
            
            <InfoBox>
              <h4>Vill du vara först med nyheterna?</h4>
              <p>Prenumerera på vårt nyhetsbrev för att få de senaste uppdateringarna direkt i din inkorg.</p>
              <CustomList>
                <CustomListItem>
                  <CheckIcon />
                  <div>Vi meddelar dig när ditt avtal går ut</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Vi meddelar dig när en ny kampanj är tillgänglig</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Vi meddelar dig när det är dags att byta för att undvika dyrare el</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Veckovis sammanfattning av marknadsutvecklingen</div>
                </CustomListItem>
                <CustomListItem>
                  <CheckIcon />
                  <div>Exklusiva erbjudanden för prenumeranter</div>
                </CustomListItem>
              </CustomList>
            </InfoBox>
            
            <SubTitle>Kommande händelser att hålla koll på:</SubTitle>
            <CustomList>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Nästa vecka:</strong> Ny rapport om energibesparingstips för vintermånaderna.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Om två veckor:</strong> Lansering av ny prisjämförelsetjänst med realtidsdata.</div>
              </CustomListItem>
              <CustomListItem>
                <ArrowRight />
                <div><strong>Månadens slut:</strong> Kvartalsrapport från energimyndigheten om marknadsutvecklingen.</div>
              </CustomListItem>
            </CustomList>
            
            <InfoBox>
              <h4>☀️ Njut av solen – och tipsa gärna vänner och familj!</h4>
              <p>
                Tipsa gärna vänner och familj om Elchef, så de slipper månadsavgifter och dyra påslag på elräkningen. 
                Elräkningen ska vara som sommaren: ljus, lätt – och inte ruinera dig.
              </p>
            </InfoBox>
            
            <div style={{ textAlign: 'center' }}>
              <CTAButton 
                href="https://elchef.se" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Upptäck dina alternativ på elchef.se <ArrowIcon />
              </CTAButton>
            </div>
          </Article>
        </Container>
      </Section>
    </PageBackground>
  );
}
