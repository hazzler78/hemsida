"use client";

import styled from 'styled-components';
import GlassButton from '@/components/GlassButton';

const Section = styled.section`
  padding: 4rem 0;
  background: transparent;
`;
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255,255,255,0.8);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 1rem;
  box-shadow: var(--glass-shadow-light);
  padding: 3rem 2rem;
  text-align: center;
`;
const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--primary);
`;
const Lead = styled.p`
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 2rem;
`;

export default function Foretag() {
  return (
    <Section>
      <Container>
        <Title>Elavtal för företag</Title>
        <Lead>
          Ett företagsavtal för el ger din verksamhet möjlighet att anpassa energilösningarna efter behov och förbrukning. Med rätt avtal kan ni uppnå förutsägbara kostnader, ökad flexibilitet och trygghet mot marknadens svängningar, så att ni kan fokusera på det som är viktigast – att driva verksamheten effektivt.
        </Lead>
        <GlassButton 
          variant="primary" 
          size="lg" 
          onClick={() => window.open('https://www.energi2.se/elavtal/?src=Elchef', '_blank')}
          background={'linear-gradient(135deg, var(--primary), var(--secondary))'}
        >
          Läs mer & teckna företagsavtal
        </GlassButton>
      </Container>
    </Section>
  );
} 