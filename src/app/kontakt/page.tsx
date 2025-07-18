"use client";

import styled from 'styled-components';

const Section = styled.section`
  padding: 4rem 0;
  background: transparent;
`;
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255,255,255,0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 1rem;
  box-shadow: var(--glass-shadow-light);
  padding: 3rem 2rem;
  text-align: center;
`;
const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #2563eb;
`;
const Lead = styled.p`
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 2rem;
`;
const MailLink = styled.a`
  display: inline-block;
  padding: 1rem 2.5rem;
  background: #2563eb;
  color: white;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  margin-bottom: 1.5rem;
  &:hover {
    background: #1741a6;
  }
`;
const Phone = styled.div`
  margin-top: 1rem;
  font-size: 1.1rem;
  color: #2563eb;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const PhoneNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OpeningHours = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 400;
`;

export default function Kontakt() {
  return (
    <Section>
      <Container>
        <Title>Kontakta oss</Title>
        <Lead>Har du frågor eller vill komma i kontakt med oss? Skicka ett mail eller ring så återkommer vi så snart vi kan.</Lead>
        <MailLink href="mailto:info@elchef.se">Maila oss på info@elchef.se</MailLink>
        <Phone>
          <PhoneNumber>
            eller ring <a href="tel:0736862360" style={{ color: '#2563eb', textDecoration: 'underline' }}>073-686 23 60</a>
          </PhoneNumber>
          <OpeningHours>10:00-18:00 Vardagar</OpeningHours>
        </Phone>
      </Container>
    </Section>
  );
} 