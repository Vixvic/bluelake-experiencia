import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import SeasonsSection from '@/components/sections/SeasonsSection';
import ExperiencesSection from '@/components/sections/ExperiencesSection';
import Pier24Section from '@/components/sections/Pier24Section';
import SafetySection from '@/components/sections/SafetySection';
import PaymentsSection from '@/components/sections/PaymentsSection';
import CorporateSection from '@/components/sections/CorporateSection';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Bluelake — Operador Turístico Amazónico | Iquitos, Perú</title>
        <meta name="description" content="Experimenta la Amazonía como nunca antes. Deportes acuáticos únicos, Muelle 24 premium, expediciones de selva. Operador turístico directo certificado en Iquitos, Perú." />
        <meta property="og:title" content="Bluelake — Operador Turístico Amazónico" />
        <meta property="og:description" content="Ski acuático, motos, tubbing y más en el río Amazonas. Reserva directo." />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <main>
        <HeroSection />
        <SeasonsSection />
        <ExperiencesSection />
        <Pier24Section />
        <SafetySection />
        <PaymentsSection />
        <CorporateSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
