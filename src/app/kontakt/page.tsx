"use client";

import styled from 'styled-components';
import ContactForm from '@/components/ContactForm';

const Section = styled.section`
  padding: var(--section-spacing) 0;
  background: transparent;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const ContactInfo = styled.div`
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow-light);
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: white;
  text-shadow: var(--text-shadow);
`;

const Lead = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
  text-shadow: var(--text-shadow);
`;

const Phone = styled.div`
  margin-top: 1rem;
  font-size: 1.1rem;
  color: white;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-shadow: var(--text-shadow);
`;

const PhoneNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PhoneLink = styled.a`
  color: var(--primary);
  text-decoration: underline;
  font-weight: 700;
  transition: color var(--transition-normal) ease;
  
  &:hover {
    color: var(--primary-dark);
  }
`;

const OpeningHours = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
`;

export default function Kontakt() {
  return (
    <Section>
      <Container>
        <ContactInfo>
          <Title>Kontakta oss</Title>
          <Lead>
            Har du frågor eller vill komma i kontakt med oss? 
            Fyll i formuläret nedan eller ring oss direkt så återkommer vi så snart vi kan.
          </Lead>
          <Phone>
            <PhoneNumber>
              Ring oss direkt: <PhoneLink href="tel:0736862360">073-686 23 60</PhoneLink>
            </PhoneNumber>
            <OpeningHours>09:00-18:00 Vardagar</OpeningHours>
          </Phone>
        </ContactInfo>
        
        <ContactForm />
      </Container>
    </Section>
  );
} 