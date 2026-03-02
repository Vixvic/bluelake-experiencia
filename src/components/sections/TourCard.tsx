import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Users } from 'lucide-react';

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

interface TourCardProps {
  tour: Tour;
  index: number;
  onClick: () => void;
}

const TourCard: React.FC<TourCardProps> = ({ tour, index, onClick }) => {
  const { t, i18n } = useTranslation();
  const title = i18n.language === 'es' ? tour.title_es : tour.title_en;
  const isSoldOut = tour.current_bookings >= tour.max_capacity;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative flex-shrink-0 w-[260px] md:w-[300px] rounded-2xl overflow-hidden bg-card border border-border shadow-bluelake text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:z-10 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Image */}
      <div className="relative h-[190px] overflow-hidden">
        <img
          src={tour.image_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Subtle gradient only for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {tour.premium && (
            <span className="bg-accent-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-current" />
              {t('experiences.premium')}
            </span>
          )}
          {isSoldOut && (
            <span className="bg-destructive text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {t('experiences.soldOut')}
            </span>
          )}
        </div>
      </div>

      {/* Content below image */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between pt-1">
          <div>
            {tour.requires_quote ? (
              <span className="text-xs font-medium text-muted-foreground">Cotizar</span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-primary">${tour.base_price}</span>
                <span className="text-[10px] text-muted-foreground font-medium">/{t('experiences.perPerson')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full">
            <Users className="w-3.5 h-3.5" />
            <span>{tour.max_capacity - tour.current_bookings}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default TourCard;
