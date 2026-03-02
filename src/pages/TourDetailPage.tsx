import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Users, ChevronLeft, Star, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCurrency } from '@/contexts/CurrencyContext';

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

const bookingSchema = z.object({
  customer_name: z.string().min(2, 'Nombre requerido'),
  customer_email: z.string().email('Email inválido'),
  customer_phone: z.string().optional(),
  adults: z.coerce.number().min(1).max(20),
  children: z.coerce.number().min(0).max(20),
  payment_method: z.enum(['transfer', 'card']),
  payment_mode: z.enum(['full', 'partial']),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const CARD_FEE = 0.06;

const TourDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { formatPrice, currency } = useCurrency();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      payment_method: 'transfer',
      payment_mode: 'full',
    },
  });

  const adults = watch('adults') || 1;
  const children = watch('children') || 0;
  const paymentMethod = watch('payment_method');
  const paymentMode = watch('payment_mode');

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

  // Price calculation
  const subtotal = (adults * tour.base_price) + (children * (tour.child_price || 0));
  const cardFee = paymentMethod === 'card' ? subtotal * CARD_FEE : 0;
  const total = subtotal + cardFee;
  const toPay = paymentMode === 'partial' ? total * 0.5 : total;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const exists = selectedDates.some(d => d.toDateString() === date.toDateString());
    if (exists) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== date.toDateString()));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (selectedDates.length === 0) {
      setSubmitError('Debes seleccionar al menos una fecha');
      return;
    }
    setSubmitError('');
    const { error } = await supabase.from('bookings').insert({
      tour_id: tour.id,
      dates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
      adults: data.adults,
      children: data.children,
      total_amount: total,
      payment_mode: data.payment_mode,
      payment_method: data.payment_method,
      card_fee: cardFee,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone || null,
      notes: data.notes || null,
      status: 'pending',
    });
    if (error) {
      setSubmitError(t('booking.error'));
    } else {
      setSubmitted(true);
    }
  };

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
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-jungle/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-jungle" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('booking.success')}</h3>
                    <p className="text-muted-foreground text-sm">Te contactaremos a tu email para confirmar los detalles.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-1">{t('booking.title')}</h2>
                      {isSoldOut && (
                        <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-destructive font-semibold text-center">Esta experiencia no tiene cupos disponibles</p>
                        </div>
                      )}
                    </div>

                    {!isSoldOut && (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Date selection */}
                        <div>
                          <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.selectDates')}</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDates.length && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDates.length > 0
                                  ? `${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''} seleccionada${selectedDates.length > 1 ? 's' : ''}`
                                  : 'Seleccionar fechas'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={undefined}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                className={cn("p-3 pointer-events-auto")}
                                modifiers={{ selected: selectedDates }}
                                modifiersClassNames={{ selected: 'bg-primary text-primary-foreground rounded-full' }}
                              />
                            </PopoverContent>
                          </Popover>
                          {selectedDates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {selectedDates.map((date) => (
                                <span key={date.toISOString()} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                                  {format(date, 'dd/MM/yyyy', { locale: es })}
                                  <button type="button" onClick={() => handleDateSelect(date)}>
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Passengers */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('booking.adults')}</label>
                            <Input type="number" min={1} max={20} {...register('adults')} />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('booking.children')}</label>
                            <Input type="number" min={0} max={20} {...register('children')} />
                            {tour.child_price ? (
                              <span className="text-xs text-muted-foreground">{formatPrice(tour.child_price)}/niño</span>
                            ) : (
                              <span className="text-xs text-jungle">Gratis para niños</span>
                            )}
                          </div>
                        </div>

                        {/* Payment method */}
                        <div>
                          <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.paymentMethod')}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['transfer', 'card'].map((method) => (
                              <label
                                key={method}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watch('payment_method') === method ? 'border-primary bg-primary/5' : 'border-border'
                                  }`}
                              >
                                <input type="radio" value={method} {...register('payment_method')} className="sr-only" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${watch('payment_method') === method ? 'border-primary' : 'border-muted-foreground'}`}>
                                  {watch('payment_method') === method && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="text-sm font-medium">{method === 'transfer' ? t('booking.transfer') : t('booking.card')}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Payment mode */}
                        <div>
                          <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.paymentMode')}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['full', 'partial'].map((mode) => (
                              <label
                                key={mode}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watch('payment_mode') === mode ? 'border-accent-orange bg-accent-orange/5' : 'border-border'
                                  }`}
                              >
                                <input type="radio" value={mode} {...register('payment_mode')} className="sr-only" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${watch('payment_mode') === mode ? 'border-accent-orange' : 'border-muted-foreground'}`}>
                                  {watch('payment_mode') === mode && <div className="w-2 h-2 rounded-full bg-accent-orange" />}
                                </div>
                                <span className="text-xs font-medium">{mode === 'full' ? t('booking.fullPayment') : t('booking.partialPayment')}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Price summary */}
                        <div className="rounded-xl bg-secondary/50 p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-foreground mb-3">{t('booking.summary')}</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('booking.subtotal')}</span>
                            <span className="font-medium">{formatPrice(subtotal)}</span>
                          </div>
                          {cardFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t('booking.cardFee')}</span>
                              <span className="font-medium text-destructive">+{formatPrice(cardFee)}</span>
                            </div>
                          )}
                          <div className="border-t border-border pt-2 flex justify-between">
                            <span className="font-semibold text-foreground">{t('booking.total')}</span>
                            <span className="font-bold text-primary text-lg">{formatPrice(total)}</span>
                          </div>
                          {paymentMode === 'partial' && (
                            <div className="bg-accent-orange/10 rounded-lg p-2 flex justify-between">
                              <span className="text-sm font-semibold text-accent-orange">{t('booking.toPay')}</span>
                              <span className="font-bold text-accent-orange">{formatPrice(toPay)}</span>
                            </div>
                          )}
                        </div>

                        {/* Contact info */}
                        <div className="space-y-3">
                          <Input {...register('customer_name')} placeholder={t('booking.name')} className={errors.customer_name ? 'border-destructive' : ''} />
                          <Input {...register('customer_email')} type="email" placeholder={t('booking.email')} className={errors.customer_email ? 'border-destructive' : ''} />
                          <Input {...register('customer_phone')} placeholder={t('booking.phone')} />
                          <Textarea {...register('notes')} placeholder={t('booking.notes')} rows={2} className="resize-none" />
                        </div>

                        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 bg-accent-orange hover:bg-accent-orange-hover text-white font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 text-lg"
                        >
                          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                          {t('booking.submit')}
                        </button>
                      </form>
                    )}
                  </>
                )}
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
