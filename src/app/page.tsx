import Hero from '@/components/Hero';
import Testimonials from '@/components/Testimonials';
import ContactForm from '@/components/ContactForm';
import FAQ from '@/components/FAQ';
import NewsletterHero from '@/components/NewsletterHero';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      {/* <PriceCalculator /> */}
      <Testimonials />
      <ContactForm />
      <FAQ />
      <NewsletterHero />
      <Footer />
    </main>
  );
}
