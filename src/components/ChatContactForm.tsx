"use client";

import { useState } from 'react';
import styled from 'styled-components';

const ContactFormContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: 18px;
  padding: 1.5rem 1.2rem;
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--glass-shadow-light);
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #17416b;
  letter-spacing: 0.01em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.85rem 1rem;
  border: 1.5px solid rgba(203, 213, 225, 0.5);
  border-radius: 12px;
  font-size: 1rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: rgba(255,255,255,0.9);
  color: #17416b;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: none;
  &::placeholder {
    color: #64748b;
    opacity: 1;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 106, 167, 0.15);
    color: #17416b;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
`;

const Checkbox = styled.input`
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--primary);
`;

const CheckboxLabel = styled.label`
  font-size: 0.95rem;
  color: #17416b;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.9rem 1.7rem;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--glass-shadow-light);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--glass-shadow-medium);
    background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  background: ${props => props.$type === 'success' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.$type === 'success' ? '#166534' : '#dc2626'};
  border: 1px solid ${props => props.$type === 'success' ? '#bbf7d0' : '#fecaca'};
`;

interface ChatContactFormProps {
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ChatContactForm({ onClose, onSubmitted }: ChatContactFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    subscribeNewsletter: true
  });
  const [ref, setRef] = useState<string | null>(null);
  const [campaignCode, setCampaignCode] = useState<string | null>(null);

  useState(() => {
    const refMatch = document.cookie.match(/(?:^|; )elchef_affiliate=([^;]+)/);
    const campMatch = document.cookie.match(/(?:^|; )elchef_campaign=([^;]+)/);
    if (refMatch) setRef(decodeURIComponent(refMatch[1]));
    if (campMatch) setCampaignCode(decodeURIComponent(campMatch[1]));
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...formData, 
          ref: ref || 'chat', 
          campaignCode,
          formType: 'chat'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ email: '', subscribeNewsletter: true });
        // Notify parent that form was submitted
        if (onSubmitted) {
          onSubmitted();
        }
        // Close form after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
        console.error('Form submission error:', result.error);
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Network error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContactFormContainer>
      <Title>Kontakta oss</Title>
      
      {submitStatus === 'success' && (
        <Message $type="success">
          ✅ Tack! Vi återkommer så snart som möjligt.
        </Message>
      )}

      {submitStatus === 'error' && (
        <Message $type="error">
          ❌ Ett fel uppstod. Försök igen.
        </Message>
      )}

      <Form onSubmit={handleSubmit}>
        <Input
          type="email"
          name="email"
          placeholder="Din e-postadress *"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        
        <CheckboxGroup>
          <Checkbox
            type="checkbox"
            id="chatSubscribeNewsletter"
            name="subscribeNewsletter"
            checked={formData.subscribeNewsletter}
            onChange={handleInputChange}
          />
          <CheckboxLabel htmlFor="chatSubscribeNewsletter">
            Prenumerera på nyhetsbrev
          </CheckboxLabel>
        </CheckboxGroup>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Skickar...' : 'Skicka'}
        </SubmitButton>
      </Form>
    </ContactFormContainer>
  );
} 