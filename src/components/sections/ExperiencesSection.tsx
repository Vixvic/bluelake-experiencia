import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSeasonalContext } from '@/contexts/SeasonalContext';
import TourCard from './TourCard';
import TourDetailModal from './TourDetailModal';

interface Tour {
  id: string;
  slug: string;
  category: string;
  season: string;
  base_price: number;
  child_price: number;
  max_capacity: number;
  current_bookings: number;
  premium: boolean;
  requires_quote: boolean;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  image_url: string;
  images: string[];
}

const CATEGORY_ORDER = ['premium', 'full-days', 'acuaticas', 'naturaleza'];

const ExperiencesSection: React.FC = () => {
  const { t } = useTranslation();
  const { selectedSeason } = useSeasonalContext();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    supabase
      .from('tours')
      .select('*')
      .eq('visible', true)
      .then(({ data }) => {
        const mutatedData = data?.map(tour => {
          if (tour.title_es?.includes('Lupuna') && !tour.title_es.includes('Arbol')) {
            return { ...tour, title_es: 'Isla de los Monos - Arbol Lupuna' };
          }
          return tour;
        });
        setTours(mutatedData || []);
        setLoading(false);
      });
  }, []);

  // Filter by season
  const seasonTours = tours.filter(
    (tour) => tour.season === 'all' || tour.season === selectedSeason
  );

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: t(`experiences.categories.${cat}`),
    tours: seasonTours.filter((tour) => tour.category === cat),
  })).filter((group) => group.tours.length > 0);

  return (
    <>
      <section id="experiencias" className="section-padding bg-background">
        <div className="container-bluelake">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t('experiences.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('experiences.subtitle')}
            </p>
          </motion.div>

          {loading ? (
            <div className="space-y-10">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-6 w-40 bg-secondary rounded-lg animate-pulse mb-4" />
                  <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-[260px] md:w-[300px] h-[240px] rounded-2xl bg-secondary animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">
                {t('experiences.subtitle')}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map((group) => (
                <CategoryRow
                  key={group.category}
                  label={group.label}
                  tours={group.tours}
                  onSelect={setSelectedTour}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Detail modal */}
      {selectedTour && (
        <TourDetailModal tour={selectedTour} onClose={() => setSelectedTour(null)} />
      )}
    </>
  );
};

// Horizontal scrollable row per category
interface CategoryRowProps {
  label: string;
  tours: Tour[];
  onSelect: (tour: Tour) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ label, tours, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    updateScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', updateScroll);
    return () => el?.removeEventListener('scroll', updateScroll);
  }, [tours]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-foreground">{label}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tours.map((tour, i) => (
          <TourCard key={tour.id} tour={tour} index={i} onClick={() => onSelect(tour)} />
        ))}
      </div>
    </motion.div>
  );
};

export default ExperiencesSection;
