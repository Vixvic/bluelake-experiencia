import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BookingTour, BookingFormData, buildWhatsAppMessage, BLUELAKE_WP } from '@/utils/whatsapp-helper';
import { format } from 'date-fns';

interface UseBookingResult {
    submitBooking: (data: BookingFormData, selectedDates: Date[], tour: BookingTour, total: number, toPay: number) => Promise<void>;
    submitted: boolean;
    submitError: string;
    whatsAppUrl: string;
    isRecurring: boolean;
}

export function useBooking(): UseBookingResult {
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [whatsAppUrl, setWhatsAppUrl] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);

    const submitBooking = async (data: BookingFormData, selectedDates: Date[], tour: BookingTour, total: number, toPay: number) => {
        setSubmitError('');
        try {
            // Plan C: Generar contraseña predecible que cumpla con HIBP (Mayus, Minus, Num)
            const tempPassword = `Bluelake${data.document_number}`;
            let newUserId: string | null = null;
            let finalIsRecurring = false;

            // 1. Intentar registrar al usuario en Auth
            // Si el correo ya existe, Supabase Auth nos devolverá User Already Registered
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.customer_email,
                password: tempPassword,
                options: {
                    data: { full_name: data.customer_name },
                    emailRedirectTo: undefined,
                },
            });

            if (authError) {
                // Permitimos continuar SOLO si el error es que el usuario ya existe (recurrente)
                const isAlreadyRegistered = authError.message.toLowerCase().includes('already registered') || 
                                          authError.message.toLowerCase().includes('user already exists');
                
                if (!isAlreadyRegistered) {
                     console.error('Error Crítico de Auth:', authError);
                     throw new Error(`Restricción del servidor (Auth): ${authError.message}`);
                }
            } else if (authData?.user) {
                newUserId = authData.user.id;
            }

            // 2. Ejecutar transacción atómica en base de datos para salvar Perfil y Reserva a la vez
            const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_booking_transaction', {
                p_tour_id: tour.id,
                p_dates: selectedDates, // El array de Date de JS es mapeable o bien podemos pasarlo parseado a YYYY-MM-DD
                p_adults: data.adults,
                p_children: data.children,
                p_total_amount: total,
                p_payment_mode: data.payment_mode,
                p_payment_method: data.payment_method,
                p_customer_name: data.customer_name,
                p_customer_email: data.customer_email,
                p_customer_phone: data.customer_phone,
                p_document_type: data.document_type,
                p_document_number: data.document_number,
                p_notes: data.notes || '',
                p_user_id: newUserId
            });

            if (rpcError) throw rpcError;
            
            const resultObj = rpcData as any;
            if (resultObj) {
                finalIsRecurring = !!resultObj.is_recurring_customer;
                setIsRecurring(finalIsRecurring);
            }

            // 3. Generar enlace de confirmación por WhatsApp
            const reservationCode = resultObj?.booking_id || 'BL' + Date.now();
            const message = buildWhatsAppMessage(
                tour,
                data,
                selectedDates,
                total,
                toPay,
                data.customer_email,
                finalIsRecurring ? null : tempPassword,
                reservationCode,
                finalIsRecurring
            );
            
            setWhatsAppUrl(`https://wa.me/${BLUELAKE_WP}?text=${message}`);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Error en reserva:', err);
            setSubmitError(err.message || 'Ocurrió un error guardando la reserva. Por favor intenta de nuevo.');
        }
    };

    return { submitBooking, submitted, submitError, whatsAppUrl, isRecurring };
}
