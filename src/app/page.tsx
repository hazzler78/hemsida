'use client';
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
