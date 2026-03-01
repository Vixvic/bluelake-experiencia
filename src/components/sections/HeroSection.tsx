import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play } from 'lucide-react';
import { siteContentService, HeroSlide } from '@/services/siteContentService';

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    image_url: 'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=1920&q=85',
    title_es: 'Ski Acuático',
    title_en: 'Water Skiing',
    order: 0
  },
  {
    id: '2',
    image_url: 'https://images.unsplash.com/photo-1626447857058-2ba6a8882dfe?w=1920&q=85',
    title_es: 'Motos Acuáticas',
    title_en: 'Jet Skis',
    order: 1
  },
  {
    id: '3',
    image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=85',
    title_es: 'Balsa en Santo Tomás',
    title_en: 'Rafting in Santo Tomás',
    order: 2
  },
  {
    id: '4',
    image_url: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1920&q=85',
    title_es: 'Isla de los Monos',
    title_en: 'Monkey Island',
    order: 3
  },
];

const SLIDE_DURATION = 6000;

const HeroSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    siteContentService.getContent().then(data => {
      if (!mounted) return;
      if (data.heroSlides && data.heroSlides.length > 0) {
        setSlides(data.heroSlides);
      } else {
        setSlides(DEFAULT_SLIDES);
      }
      setIsDataLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  const nextSlide = useCallback(() => {
    setSlides(prev => {
      if (prev.length === 0) return prev;
      setCurrentSlide((current) => (current + 1) % prev.length);
      return prev;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slide = slides[currentSlide] || DEFAULT_SLIDES[0];
  const slideLabel = i18n.language === 'es' ? slide.title_es : slide.title_en;

  if (!isDataLoaded) {
    return (
      <section className="relative h-screen min-h-[600px] flex items-end overflow-hidden bg-black">
        {/* Placeholder vacío para evitar flash de imágenes por defecto */}
      </section>
    );
  }

  return (
    <section className="relative h-screen min-h-[600px] flex items-end overflow-hidden bg-black">
      {/* Background slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slide.image_url}
            alt={slideLabel}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays — left side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      {/* Content — positioned bottom-left like Disney+ */}
      <div className="relative z-10 container-bluelake pb-24 md:pb-32 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-5 text-white">
              <span className="w-2 h-2 rounded-full bg-accent-orange animate-pulse" />
              {t('hero.tagline')}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 text-white whitespace-pre-line"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base md:text-xl text-white/80 max-w-xl mb-8 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <a href="#experiencias">
              <button className="px-8 py-4 bg-accent-orange hover:bg-accent-orange-hover text-white font-bold rounded-full text-lg transition-all shadow-orange hover:scale-105 active:scale-95">
                {t('hero.cta')}
              </button>
            </a>
            <a href="#muelle24">
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full text-lg transition-all flex items-center gap-2">
                <Play className="w-5 h-5" />
                {t('hero.ctaSecondary')}
              </button>
            </a>
          </motion.div>
        </div>

        {/* Slide indicator + current experience label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 flex items-center gap-4"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={currentSlide}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-sm text-white/70 font-medium"
            >
              {slideLabel}
            </motion.span>
          </AnimatePresence>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide
                  ? 'w-8 bg-accent-orange'
                  : 'w-4 bg-white/30 hover:bg-white/50'
                  }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 z-10"
      >
        <span className="text-xs font-medium tracking-widest uppercase">{t('hero.scrollDown')}</span>
        <ChevronDown className="w-5 h-5 animate-scroll-bounce" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
