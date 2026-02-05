"use client";

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa';
import Script from 'next/script';

const FAQSection = styled.section`
  padding: 4rem 1rem;
  background: transparent;
  border-radius: var(--radius-lg);
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 3rem;
  color: white;
  font-size: 2rem;
`;

const AccordionItem = styled.div`
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: var(--glass-shadow-light);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
`;

const AccordionHeader = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.$isOpen ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'};
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: white;
  text-align: left;

  svg {
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
    transition: transform 0.2s;
    color: var(--primary);
  }

  &:hover {
    background: rgba(255,255,255,0.12);
  }
`;

const AccordionContent = styled.div<{ $isOpen: boolean }>`
  padding: ${props => props.$isOpen ? '0 1.25rem 1.25rem' : '0 1.25rem'};
  color: rgba(255,255,255,0.9);
  max-height: ${props => props.$isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  opacity: ${props => props.$isOpen ? '1' : '0'};

  p {
    margin-bottom: 1rem;
  }

  ul {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }
`;

const faqData = [
  {
    question: "Hur hittar jag bra elavtal?",
    answer: "Om du inte hittar ett avtal du vill på vår sida, kan du registrera din e-postadress i formuläret nere i foten av sidan. Detta ger dig möjligheten att säkra bra priser, innan erbjudanden med begränsad kapacitet blir fullbokade."
  },
  {
    question: "Hur fungerar Elchef.se?",
    answer: "Elchef.se hittar bra elavtal från olika leverantörer och ger dig möjligheten att välja det avtal som passar dig bäst. Du kan vara säker på att de erbjudanden du hittar här är konkurrenskraftiga på marknaden!"
  },
  {
    question: "Vad ska jag välja? Fastpris eller Rörligt pris?",
    answer: "Det beror på din livsstil och vad du känner dig bekväm med. Med ett fastprisavtal har du förutsägbarhet under hela avtalsperioden. Med ett rörligt pris följer ditt elpris marknadens svängningar men kan eventuellt spara pengar i längden. Fråga dig själv: Tror du att elpriserna kommer att bli billigare eller dyrare framöver?"
  },
  {
    question: "Vad är en Elchef?",
    answer: "En \"Elchef\" tar kontroll över sitt elavtal för att hålla kostnaderna nere. Du är en elchef när du gör ett medvetet val för att säkra ett bättre avtal och undvika att betala mer än nödvändigt."
  },
  {
    question: "Måste jag säga upp mitt gamla elavtal om jag byter leverantör?",
    answer: "Nej, du behöver oftast inte säga upp ditt gamla elavtal själv. När du byter elleverantör hanterar den nya leverantören vanligtvis bytet åt dig, inklusive uppsägningen av ditt tidigare avtal. Däremot är det bra att kontrollera villkoren i ditt nuvarande avtal, särskilt om du har ett fastprisavtal, eftersom det kan finnas uppsägningstid eller avgifter för att avsluta avtalet i förtid."
  },
  {
    question: "Är det någon avgift för att säga upp ett elavtal?",
    answer: `Rörliga elavtal kan oftast sägas upp utan avgift och har normalt en uppsägningstid på en månad.

Fastprisavtal däremot har en bindningstid, och om du vill avsluta avtalet i förtid kan det tillkomma en brytavgift (även kallad lösenavgift). Avgiften varierar mellan olika leverantörer och beror på hur lång tid som återstår av avtalet samt elprisutvecklingen.

Det är alltid bäst att kontrollera villkoren i ditt avtal eller kontakta din elleverantör för att få exakt information om vad som gäller vid en uppsägning.`
  },
  {
    question: "Vilket Elområde/Elzon tillhör jag?",
    answer: `Sverige är indelat i fyra elområden:

SE1 - Norra Sverige
SE2 - Norra Mellansverige
SE3 - Södra Mellansverige
SE4 - Södra Sverige

Vilket elområde du tillhör beror på var du bor och påverkar elpriset i din region. Du kan se ditt elområde på din elräkning, genom att kontakta din nätleverantör, eller använda formuläret i våra avtalslistor.`
  },
  {
    question: "Vad bör jag tänka på när jag väljer elavtal?",
    answer: "Välj elavtal utifrån din ekonomiska situation din risktolerans. Om du har en tight budget och vill undvika prissvängningar kan ett fastprisavtal vara ett bra alternativ. Rörliga avtal (spotpris) har historiskt sett varit billigare över tid, men innebär större risk för prisvariationer. Fundera på vad som passar din situation bäst innan du gör ditt val."
  },
  {
    question: "Kan jag ångra mitt elavtal?",
    answer: `Ja, enligt distansavtalslagen har du ångerrätt i 14 dagar när du tecknar ett avtal på distans, som exempelvis digitalt eller via telefon. Det innebär att du kan ångra avtalet utan kostnad inom denna period. Det finns dock undantag:
        
• Om du har betalat förbrukad el under ångerperioden kan leverantören kräva ersättning för den el du använt.
• Ångerrätten gäller inte om du har tecknat avtalet genom ett personligt möte hos leverantören eller i en butik.
• Vissa leverantörer kan ha egna villkor gällande uppsägning efter ångerfristen, så det är alltid bra att läsa avtalet noggrant.
• Om du vill ångra ditt avtal ska du meddela leverantören skriftligen, via e-post eller ångerformulär.`
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.replace(/\n/g, '<br />'),
        },
      })),
    }),
    []
  );

  return (
    <FAQSection>
      <Container>
        <Title>Vanliga frågor</Title>
        <Script id="faq-json-ld" type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </Script>
        {faqData.map((faq, index) => (
          <AccordionItem key={index}>
            <AccordionHeader
              onClick={() => toggleAccordion(index)}
              $isOpen={openIndex === index}
            >
              {faq.question}
              <FaChevronDown />
            </AccordionHeader>
            <AccordionContent $isOpen={openIndex === index}>
              <div dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br />') }} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Container>
    </FAQSection>
  );
} 