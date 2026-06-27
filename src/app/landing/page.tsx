'use client';

import Navigation from '@/components/landing/navigation';
import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import Philosophy from '@/components/landing/philosophy';
import CTA from '@/components/landing/cta';
import Footer from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <Hero />
      <Philosophy />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
