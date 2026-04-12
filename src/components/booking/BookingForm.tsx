import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X, CheckCircle2, Loader2, MessageCircle, Lock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BookingTour, BookingFormData, CARD_FEE_RATE } from '@/utils/whatsapp-helper';
import { useBooking } from '@/hooks/useBooking';
import { getDynamicTranslation } from '@/utils/dynamicTranslations';

interface BookingFormProps {
    tour: BookingTour;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const getBookingSchema = (maxCapacity: number) => z.object({
    customer_name: z.string().min(2, 'Nombre requerido'),
    customer_email: z.string().email('Email inválido'),
    customer_phone: z.string().min(6, 'Teléfono requerido'),
    document_type: z.enum(['DNI', 'Pasaporte', 'CE']),
    document_number: z.string().min(5, 'Documento requerido'),
    adults: z.coerce.number().min(1).max(20),
    children: z.coerce.number().min(0).max(20),
    payment_method: z.enum(['transfer', 'yape', 'plin', 'card']),
    payment_mode: z.enum(['full', 'partial']),
    notes: z.string().optional(),
}).refine(data => (data.adults + data.children) <= maxCapacity, {
    message: `Excede la capacidad de ${maxCapacity} cupos`,
    path: ['adults'],
});

// ── Component ─────────────────────────────────────────────────────────────────

const BookingForm: React.FC<BookingFormProps> = ({ tour }) => {
    const { t, i18n } = useTranslation();
    const { formatPrice } = useCurrency();

    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    
    const { submitBooking, submitted, submitError, whatsAppUrl, isRecurring, hasActiveSession, tempPassword, customerEmail, previousBookings } = useBooking();

    const isSoldOut = tour.current_bookings >= tour.max_capacity;
    const availableCapacity = Math.max(0, tour.max_capacity - tour.current_bookings);
    const tourTitle = i18n.language === 'es' ? tour.title_es : tour.title_en;

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
        resolver: zodResolver(getBookingSchema(availableCapacity)),
        defaultValues: {
            adults: 1,
            children: 0,
            payment_method: 'transfer',
            payment_mode: 'full',
            document_type: 'DNI',
        },
    });

    const adults = watch('adults') || 1;
    const children = watch('children') || 0;
    const paymentMethod = watch('payment_method');
    const paymentMode = watch('payment_mode');
    const watchAll = watch();

    const subtotal = (adults * tour.base_price) + (children * (tour.child_price || 0));
    const cardFee = paymentMethod === 'card' ? subtotal * CARD_FEE_RATE : 0;
    const total = subtotal + cardFee;
    const toPay = paymentMode === 'partial' ? total * 0.5 : total;

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const exists = selectedDates.some(d => d.toDateString() === date.toDateString());
        setSelectedDates(exists
            ? selectedDates.filter(d => d.toDateString() !== date.toDateString())
            : [...selectedDates, date]
        );
    };

    const onSubmit = async (data: BookingFormData) => {
        if (selectedDates.length === 0) return;
        await submitBooking(data, selectedDates, tour, total, toPay);
    };

    // ── Success Screen ──────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-jungle/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9 text-jungle" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">¡Reserva registrada!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {previousBookings.length > 1
                            ? `Tienes ${previousBookings.length} reservas activas. Envía este mensaje consolidado a WhatsApp para confirmar tus pagos.`
                            : 'Tu solicitud fue guardada. Ahora envíanos este mensaje a WhatsApp para confirmar tu pago y recibir las instrucciones.'}
                    </p>
                </div>

                <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl transition-all hover:scale-[1.02] text-base"
                >
                    <MessageCircle className="w-5 h-5" />
                    {previousBookings.length > 1
                        ? `Enviar ${previousBookings.length} reservas por WhatsApp`
                        : 'Enviar confirmación por WhatsApp'}
                </a>

                {/* Información de reservas previas */}
                {previousBookings.length > 1 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left space-y-2">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                            📋 Tus reservas activas ({previousBookings.length})
                        </p>
                        <div className="space-y-1.5">
                            {previousBookings.map((b, i) => (
                                <div key={b.id || i} className="flex justify-between items-center text-xs bg-background rounded-lg px-3 py-2 border border-border">
                                    <span className="font-medium text-foreground truncate flex-1">{b.title_es}</span>
                                    <span className="text-primary font-bold ml-2 whitespace-nowrap">S/ {(b.total_amount || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-border bg-secondary/30 p-4 text-left space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Tu acceso al Portal de Cliente</span>
                    </div>

                    {/* Escenario 1: Usuario recurrente CON sesión activa */}
                    {isRecurring && hasActiveSession && (
                        <div className="space-y-2">
                            <div className="bg-jungle/10 rounded-lg p-2.5 border border-jungle/20">
                                <p className="text-xs text-jungle font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Reserva vinculada a tu cuenta ✓
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tu nueva reserva ya está vinculada a tu cuenta activa. Puedes verla directamente en tu dashboard.
                            </p>
                        </div>
                    )}

                    {/* Escenario 2: Usuario recurrente SIN sesión activa */}
                    {isRecurring && !hasActiveSession && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Ya tienes una cuenta registrada con este correo. Inicia sesión para ver todas tus reservas y descargar vouchers.
                            </p>
                            <p className="text-xs text-amber-600 font-medium">
                                💡 Si olvidaste tu contraseña, usa la opción de recuperar contraseña en la página de login.
                            </p>
                        </div>
                    )}

                    {/* Escenario 3: Usuario nuevo */}
                    {!isRecurring && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Hemos creado tu cuenta. Usa estas credenciales para ingresar:</p>
                            <div className="bg-background rounded-lg p-2.5 border border-border space-y-1.5">
                                <div>
                                    <p className="text-xs text-muted-foreground">📧 Correo</p>
                                    <p className="text-xs font-mono font-semibold text-foreground select-all">{customerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">🔑 Contraseña temporal</p>
                                    <p className="text-xs font-mono font-bold text-primary select-all">{tempPassword}</p>
                                </div>
                                <p className="text-xs text-amber-600 font-medium">⚠️ Cópiala ahora y cámbiala al ingresar</p>
                            </div>
                        </div>
                    )}

                    <a
                        href="/bluelake-experiencia/login"
                        className="text-xs text-primary hover:underline font-semibold block mt-2"
                    >
                        {hasActiveSession ? '→ Ir a mi Dashboard' : '→ Ir al Portal de Cliente'}
                    </a>
                </div>
            </div>
        );
    }

    // ── Form ────────────────────────────────────────────────────────────────────
    if (isSoldOut) {
        return (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-sm text-destructive font-semibold">Esta experiencia no tiene cupos disponibles</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Date selection */}
            <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.selectDates')}</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !selectedDates.length && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDates.length > 0
                                ? `${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''} seleccionada${selectedDates.length > 1 ? 's' : ''}`
                                : 'Seleccionar fecha(s)'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={undefined}
                            onSelect={handleDateSelect}
                            disabled={(date) => date < new Date()}
                            className={cn('p-3 pointer-events-auto')}
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
                                <button type="button" onClick={() => handleDateSelect(date)}><X className="w-3 h-3" /></button>
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
                    {tour.child_price
                        ? <span className="text-xs text-muted-foreground">{formatPrice(tour.child_price)}/niño</span>
                        : <span className="text-xs text-jungle">Gratis para niños</span>}
                </div>
            </div>

            {/* Payment method */}
            <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.paymentMethod')}</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'transfer', label: 'Transferencia' },
                        { value: 'yape', label: 'Yape' },
                        { value: 'plin', label: 'Plin' },
                        { value: 'card', label: 'Tarjeta (+6%)' },
                    ].map(({ value, label }) => (
                        <label
                            key={value}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watchAll.payment_method === value ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                            <input type="radio" value={value} {...register('payment_method')} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${watchAll.payment_method === value ? 'border-primary' : 'border-muted-foreground'}`}>
                                {watchAll.payment_method === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-sm font-medium">{getDynamicTranslation(label, i18n.language)}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Payment mode */}
            <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('booking.paymentMode')}</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'full', label: t('booking.fullPayment') },
                        { value: 'partial', label: t('booking.partialPayment') },
                    ].map(({ value, label }) => (
                        <label
                            key={value}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watchAll.payment_mode === value ? 'border-accent-orange bg-accent-orange/5' : 'border-border'}`}
                        >
                            <input type="radio" value={value} {...register('payment_mode')} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${watchAll.payment_mode === value ? 'border-accent-orange' : 'border-muted-foreground'}`}>
                                {watchAll.payment_mode === value && <div className="w-2 h-2 rounded-full bg-accent-orange" />}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
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
                        <span className="text-muted-foreground">Recargo tarjeta (6%)</span>
                        <span className="font-medium text-amber-600">+ {formatPrice(cardFee)}</span>
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
                <Input
                    {...register('customer_name')}
                    placeholder={t('booking.name')}
                    className={errors.customer_name ? 'border-destructive' : ''}
                />
                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}

                {/* Document */}
                <div className="flex gap-2">
                    <select
                        {...register('document_type')}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                        <option value="DNI">DNI</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="CE">C.E.</option>
                    </select>
                    <Input
                        {...register('document_number')}
                        placeholder="N° Documento"
                        className={cn('flex-1', errors.document_number ? 'border-destructive' : '')}
                    />
                </div>

                <Input
                    {...register('customer_email')}
                    type="email"
                    placeholder={t('booking.email')}
                    className={errors.customer_email ? 'border-destructive' : ''}
                />
                {errors.customer_email && <p className="text-xs text-destructive">{errors.customer_email.message}</p>}

                <Input
                    {...register('customer_phone')}
                    placeholder={t('booking.phone')}
                    className={errors.customer_phone ? 'border-destructive' : ''}
                />
                {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone.message}</p>}

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
    );
};

export default BookingForm;
