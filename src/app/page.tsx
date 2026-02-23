'use client';

import { useEffect } from 'react';
import Hero, { HeroUSPs } from '@/components/Hero';
import HeroPriceWidget from '@/components/HeroPriceWidget';
import Testimonials from '@/components/Testimonials';
import ContactForm from '@/components/ContactForm';
import FAQ from '@/components/FAQ';
import SolarQuoteForm from '@/components/SolarQuoteForm';
import NewsletterHero from '@/components/NewsletterHero';
import { usePageView } from '@/lib/usePageView';

export default function Home() {
  // Spåra sidvisning med UTM-parametrar
  usePageView('/');

  // När någon kommer till startsidan med #solceller (t.ex. från länk eller annan sida), scrolla till kontaktformuläret
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#solceller') return;
    const el = document.getElementById('solceller');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <main>
      <Hero />
      <HeroPriceWidget />
      <HeroUSPs />
      {/* <PriceCalculator /> */}
      <Testimonials />
      <ContactForm />
      <FAQ />
      <SolarQuoteForm />
      <NewsletterHero />
    </main>
  );
}
