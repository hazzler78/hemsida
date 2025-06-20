"use client";

import styled from 'styled-components';

const Section = styled.section`
  padding: 4rem 0;
  background: #f8fafc;
`;
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.07);
  padding: 3rem 2rem;
  text-align: center;
`;
const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #2563eb;
`;
const Lead = styled.p`
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 2rem;
`;
const CTAButton = styled.a`
  display: inline-block;
  margin-top: 2rem;
  padding: 1rem 2.5rem;
  background: #2563eb;
  color: white;
  border-radius: 0.5rem;
  font-size: 1.15rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: #1741a6;
  }
`;

export default function Foretag() {
  return (
    <Section>
      <Container>
        <Title>Elavtal för företag</Title>
        <Lead>
          Ett företagsavtal för el ger din verksamhet möjlighet att anpassa energilösningarna efter behov och förbrukning. Med rätt avtal kan ni uppnå förutsägbara kostnader, ökad flexibilitet och trygghet mot marknadens svängningar, så att ni kan fokusera på det som är viktigast – att driva verksamheten effektivt.
        </Lead>
        <CTAButton href="https://energi2.se/elchef/" target="_blank" rel="noopener noreferrer">
          Läs mer & teckna företagsavtal
        </CTAButton>
      </Container>
    </Section>
  );
} 