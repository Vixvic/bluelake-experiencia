import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, Star, Users } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCurrency } from '@/contexts/CurrencyContext';
import BookingForm from '@/components/booking/BookingForm';

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

// BookingForm importado desde @/components/booking/BookingForm

const TourDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    supabase.from('tours').select('*').eq('slug', slug).single()
      .then(({ data }) => {
        if (data && data.title_es?.includes('Lupuna') && !data.title_es.includes('Arbol')) {
          data.title_es = 'Isla de los Monos - Arbol Lupuna';
        }
        setTour(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!tour) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-semibold text-foreground">Tour no encontrado</p>
      <Link to="/" className="text-primary hover:underline">← Volver al inicio</Link>
    </div>
  );

  const title = i18n.language === 'es' ? tour.title_es : tour.title_en;
  const description = i18n.language === 'es' ? tour.description_es : tour.description_en;
  const isSoldOut = tour.current_bookings >= tour.max_capacity;



  const images = [tour.image_url, ...(tour.images || [])].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="container-bluelake py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver a experiencias
          </Link>
        </div>

        <div className="container-bluelake pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left: Tour info */}
            <div className="lg:col-span-3 space-y-8">
              {/* Image gallery */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden">
                <div className="relative h-[380px]">
                  <img
                    src={images[activeImage] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {tour.premium && (
                    <div className="absolute top-4 left-4 bg-accent-orange text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-white" />
                      PREMIUM
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold bg-destructive/80 px-6 py-3 rounded-xl">SOLD OUT</span>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">{tour.category}</span>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground drop-shadow-sm">{title}</h1>
                  </div>
                  {!tour.requires_quote && (
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground block">{t('experiences.from')}</span>
                      <span className="text-3xl font-bold text-primary">{formatPrice(tour.base_price)}</span>
                      <span className="text-sm text-muted-foreground block">/{t('experiences.perPerson')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tour.season === 'summer' ? 'bg-accent-orange/10 text-accent-orange' :
                    tour.season === 'winter' ? 'bg-primary/10 text-primary' :
                      'bg-jungle/10 text-jungle'
                    }`}>
                    {tour.season === 'summer' ? t('experiences.summer') :
                      tour.season === 'winter' ? t('experiences.winter') :
                        t('experiences.allYear')}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {tour.max_capacity - tour.current_bookings} lugares disponibles
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed text-lg">{description}</p>
              </motion.div>
            </div>

            {/* Right: Booking form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 rounded-2xl border border-border bg-card shadow-bluelake p-6 space-y-6"
              >
                <h2 className="text-xl font-bold text-foreground mb-1">{t('booking.title')}</h2>
                <BookingForm tour={tour} />
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TourDetailPage;
