"use client";

import React, { useState } from 'react';
import styled from 'styled-components';

const Section = styled.section`
  background: linear-gradient(160deg, rgba(0, 106, 167, 0.15) 0%, rgba(254, 204, 0, 0.08) 100%);
  padding: var(--section-spacing) 0;
  color: white;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Container = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: white;
  text-shadow: var(--text-shadow);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  color: white;
  text-shadow: var(--text-shadow);
`;

const Form = styled.form`
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-light);
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  text-shadow: var(--text-shadow);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  color: var(--foreground);
  font-size: 1rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: all var(--transition-normal) ease;

  &::placeholder {
    color: #64748b;
    opacity: 1;
  }

  &:focus {
    outline: none;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 106, 167, 0.15);
    transform: translateY(-1px);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  color: var(--foreground);
  font-size: 1rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  resize: vertical;
  min-height: 80px;
  transition: all var(--transition-normal) ease;

  &::placeholder {
    color: #64748b;
    opacity: 1;
  }

  &:focus {
    outline: none;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 106, 167, 0.15);
    transform: translateY(-1px);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow-light);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--glass-shadow-medium);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.9);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  text-align: center;
  font-weight: 600;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  text-align: center;
  font-weight: 600;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

export default function SolarQuoteForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [ref, setRef] = useState<string | null>(null);
  const [campaignCode, setCampaignCode] = useState<string | null>(null);

  React.useEffect(() => {
    const refMatch = document.cookie.match(/(?:^|; )elchef_affiliate=([^;]+)/);
    const campMatch = document.cookie.match(/(?:^|; )elchef_campaign=([^;]+)/);
    if (refMatch) setRef(decodeURIComponent(refMatch[1]));
    if (campMatch) setCampaignCode(decodeURIComponent(campMatch[1]));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!formData.email || !formData.email.includes('@')) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
          // Håll meddelandet rent – Telegram Markdown kan strula på [ ]
          message: formData.message || undefined,
          subscribeNewsletter: false,
          ref: ref || 'sol_laddbox',
          campaignCode: campaignCode || undefined,
          formType: 'sol_laddbox',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Section id="solceller">
      <Container>
        <Title>Ta nästa steg mot total energibesparing</Title>
        <Subtitle>
          När elavtalet är på plats kan solceller, batteri och laddbox sänka din elräkning ytterligare. 
          Lämna en intresseanmälan så kopplar vi dig till en pålitlig partner. Ingen förpliktelse.
        </Subtitle>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="solar-name">Namn</Label>
            <Input
              type="text"
              id="solar-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ditt namn"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="solar-email">E-post *</Label>
            <Input
              type="email"
              id="solar-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="din@epost.se"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="solar-phone">Telefon</Label>
            <Input
              type="tel"
              id="solar-phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="070-123 45 67"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="solar-message">Övrigt (valfritt)</Label>
            <Textarea
              id="solar-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="T.ex. intresse för laddbox, ungefärlig takyta..."
              rows={2}
            />
          </FormGroup>
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Skickar...' : 'Begär gratis offert'}
          </SubmitButton>
        </Form>

        {submitStatus === 'success' && (
          <SuccessMessage>
            Tack! Vi har tagit emot din förfrågan. Vår partner återkommer med en offert.
          </SuccessMessage>
        )}
        {submitStatus === 'error' && (
          <ErrorMessage>
            Något gick fel. Kontrollera att e-postadressen är korrekt och försök igen.
          </ErrorMessage>
        )}
      </Container>
    </Section>
  );
}
