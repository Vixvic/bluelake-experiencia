import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, Calendar as CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  images?: string[];
}

interface TourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
}

const bookingSchema = z.object({
  customer_name: z.string().min(2, 'Nombre requerido'),
  customer_email: z.string().email('Email inválido'),
  customer_phone: z.string().optional(),
  adults: z.coerce.number().min(1).max(20),
  children: z.coerce.number().min(0).max(20),
  document_type: z.enum(['DNI', 'CE', 'Pasaporte']),
  document_number: z.string().min(5, 'Documento inválido'),
  payment_method: z.enum(['transfer', 'card']),
  payment_mode: z.enum(['full', 'partial']),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;
const CARD_FEE = 0.06;

const TourDetailModal: React.FC<TourDetailModalProps> = ({ tour, onClose }) => {
  const { t, i18n } = useTranslation();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { adults: 1, children: 0, payment_method: 'transfer', payment_mode: 'full', document_type: 'DNI' },
  });

  if (!tour) return null;

  const title = i18n.language === 'es' ? tour.title_es : tour.title_en;
  const description = i18n.language === 'es' ? tour.description_es : tour.description_en;
  const isSoldOut = tour.current_bookings >= tour.max_capacity;

  const adults = watch('adults') || 1;
  const children = watch('children') || 0;
  const paymentMethod = watch('payment_method');
  const paymentMode = watch('payment_mode');
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
      document_type: data.document_type,
      document_number: data.document_number,
      notes: data.notes || null,
      status: 'pending',
    });
    if (error) setSubmitError(t('booking.error'));
    else setSubmitted(true);
  };

  const getSeasonLabel = (season: string) => {
    if (season === 'winter') return t('experiences.winter');
    if (season === 'summer') return t('experiences.summer');
    return t('experiences.allYear');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero image */}
          <div className="relative h-[280px] md:h-[340px]">
            <img
              src={tour.image_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

            {/* Title overlay */}
            <div className="absolute bottom-6 left-6 right-20">
              <div className="flex items-center gap-2 mb-3">
                {tour.premium && (
                  <span className="bg-accent-orange text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-current" /> PREMIUM
                  </span>
                )}
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-md border border-white/20 backdrop-blur-md ${tour.season === 'summer' ? 'bg-orange-500/80 text-white' :
                  tour.season === 'winter' ? 'bg-blue-600/80 text-white' :
                    'bg-emerald-600/80 text-white'
                  }`}>
                  {getSeasonLabel(tour.season)}
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] filter">
                {title}
              </h2>
            </div>
          </div>

          {/* Content: two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left: Description */}
            <div className="lg:col-span-3 p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-4">
                {!tour.requires_quote && (
                  <div>
                    <span className="text-xs text-muted-foreground">{t('experiences.from')}</span>
                    <div className="text-2xl font-bold text-primary">
                      ${tour.base_price}
                      <span className="text-xs font-normal text-muted-foreground ml-1">/{t('experiences.perPerson')}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {tour.max_capacity - tour.current_bookings} {i18n.language === 'es' ? 'lugares disponibles' : 'spots available'}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed text-base md:text-lg whitespace-pre-line">
                {description}
              </p>

              {/* Galería de imágenes (Max 5) */}
              {tour.images && tour.images.length > 0 && (
                <div className="pt-6 mt-6 border-t border-border">
                  <h3 className="text-xl font-bold mb-4 text-foreground">{i18n.language === 'es' ? 'Galería' : 'Gallery'}</h3>
                  <div className={`grid gap-2 md:gap-3 ${tour.images.length === 1 ? 'grid-cols-1 h-[250px] md:h-[350px]' :
                    tour.images.length === 2 ? 'grid-cols-2 h-[200px] md:h-[300px]' :
                      tour.images.length === 3 ? 'grid-cols-1 md:grid-cols-3 grid-rows-2 h-[400px]' :
                        tour.images.length === 4 ? 'grid-cols-2 grid-rows-2 h-[300px] md:h-[400px]' :
                          'grid-cols-2 md:grid-cols-4 grid-rows-2 h-[350px] md:h-[450px]'
                    }`}>
                    {tour.images.slice(0, 5).map((img, i) => {
                      let spanClasses = 'col-span-1 row-span-1';
                      const total = tour.images!.length;

                      if (total === 3) {
                        if (i === 0) spanClasses = 'col-span-1 md:col-span-2 row-span-1 md:row-span-2 hidden md:block';
                      } else if (total >= 5) {
                        if (i === 0) spanClasses = 'col-span-2 row-span-1 md:row-span-2';
                        else if (i > 2) spanClasses = 'hidden md:block col-span-1 row-span-1';
                      }

                      return (
                        <div key={i} className={`relative rounded-xl overflow-hidden group ${spanClasses}`}>
                          <img src={img} alt={`${title} gallery ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isSoldOut && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-semibold text-center">
                    {i18n.language === 'es' ? 'Esta experiencia no tiene cupos disponibles' : 'This experience is sold out'}
                  </p>
                </div>
              )}

              {/* CTA for mobile - show booking form below */}
              {!isSoldOut && !showBookingForm && (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="lg:hidden w-full py-3 btn-orange font-bold rounded-xl text-lg animate-pulse-orange"
                >
                  {t('experiences.bookNow')}
                </button>
              )}
            </div>

            {/* Right: Booking panel */}
            <div className={`lg:col-span-2 border-t lg:border-t-0 lg:border-l border-border bg-secondary/30 p-6 md:p-8 ${!showBookingForm ? 'hidden lg:block' : ''}`}>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-jungle/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-jungle" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{t('booking.success')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {i18n.language === 'es' ? 'Te contactaremos a tu email para confirmar.' : 'We will contact you via email to confirm.'}
                  </p>
                </div>
              ) : isSoldOut ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('experiences.soldOut')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">{t('booking.title')}</h3>

                  {/* Dates */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">{t('booking.selectDates')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDates.length && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDates.length > 0
                            ? `${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''}`
                            : i18n.language === 'es' ? 'Seleccionar fechas' : 'Select dates'}
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
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedDates.map((date) => (
                          <span key={date.toISOString()} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {format(date, 'dd/MM', { locale: es })}
                            <button type="button" onClick={() => handleDateSelect(date)}><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Passengers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">{t('booking.adults')}</label>
                      <Input type="number" min={1} max={20} {...register('adults')} className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">{t('booking.children')}</label>
                      <Input type="number" min={0} max={20} {...register('children')} className="h-9" />
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-2 gap-2">
                    {['transfer', 'card'].map((method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs ${watch('payment_method') === method ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                      >
                        <input type="radio" value={method} {...register('payment_method')} className="sr-only" />
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${watch('payment_method') === method ? 'border-primary' : 'border-muted-foreground'}`}>
                          {watch('payment_method') === method && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <span className="font-medium">{method === 'transfer' ? t('booking.transfer') : t('booking.card')}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {['full', 'partial'].map((mode) => (
                      <label
                        key={mode}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-xs ${watch('payment_mode') === mode ? 'border-accent-orange bg-accent-orange/5' : 'border-border'
                          }`}
                      >
                        <input type="radio" value={mode} {...register('payment_mode')} className="sr-only" />
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${watch('payment_mode') === mode ? 'border-accent-orange' : 'border-muted-foreground'}`}>
                          {watch('payment_mode') === mode && <div className="w-1.5 h-1.5 rounded-full bg-accent-orange" />}
                        </div>
                        <span className="font-medium">{mode === 'full' ? t('booking.fullPayment') : t('booking.partialPayment')}</span>
                      </label>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-secondary/50 p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('booking.subtotal')}</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {cardFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('booking.cardFee')}</span>
                        <span className="font-medium text-destructive">+${cardFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-1.5 flex justify-between">
                      <span className="font-semibold">{t('booking.total')}</span>
                      <span className="font-bold text-primary">${total.toFixed(2)}</span>
                    </div>
                    {paymentMode === 'partial' && (
                      <div className="bg-accent-orange/10 rounded-lg p-2 flex justify-between">
                        <span className="text-xs font-semibold text-accent-orange">{t('booking.toPay')}</span>
                        <span className="font-bold text-accent-orange">${toPay.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <Input {...register('customer_name')} placeholder={t('booking.name')} className={cn("h-9", errors.customer_name && 'border-destructive')} />
                    <div className="flex gap-2">
                      <select
                        {...register('document_type')}
                        className="flex h-9 w-[110px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">CE</option>
                        <option value="Pasaporte">{t('booking.passport') || 'Pasaporte'}</option>
                      </select>
                      <Input
                        {...register('document_number')}
                        placeholder={t('booking.documentNumber') || 'N° Documento'}
                        className={cn("h-9 flex-1", errors.document_number && 'border-destructive')}
                      />
                    </div>
                    <Input {...register('customer_email')} type="email" placeholder={t('booking.email')} className={cn("h-9", errors.customer_email && 'border-destructive')} />
                    <Input {...register('customer_phone')} placeholder={t('booking.phone')} className="h-9" />
                    <Textarea {...register('notes')} placeholder={t('booking.notes')} rows={2} className="resize-none" />
                  </div>

                  {submitError && <p className="text-xs text-destructive">{submitError}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 btn-orange font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('booking.submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TourDetailModal;
