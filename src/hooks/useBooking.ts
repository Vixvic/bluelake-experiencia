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
    tempPassword: string;
    customerEmail: string;
}

export function useBooking(): UseBookingResult {
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [whatsAppUrl, setWhatsAppUrl] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    const submitBooking = async (data: BookingFormData, selectedDates: Date[], tour: BookingTour, total: number, toPay: number) => {
        setSubmitError('');
        try {
            // Contraseña temporal: "Bluelake" + DNI (cumple Mayus + minus + nums)
            const tempPassword = `Bluelake${data.document_number}`;
            setTempPassword(tempPassword);
            setCustomerEmail(data.customer_email);
            let newUserId: string | null = null;
            let finalIsRecurring = false;

            // ── PASO 1: Registrar usuario en Auth ─────────────────────────────────────────
            // Usamos la misma lógica limpia de Login.tsx que funciona perfectamente.
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: data.customer_email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: data.customer_name,
                        document_type: data.document_type,
                        document_number: data.document_number,
                        phone: data.customer_phone,
                    },
                },
            });

            if (signUpError) {
                const errMsg = signUpError.message.toLowerCase();
                const errStatus = (signUpError as any).status;
                console.error('[useBooking] signUp error:', signUpError.status, signUpError.message);

                // Detectar: usuario ya existe OR rate limit OR email de burner
                const isAlreadyRegistered = errMsg.includes('already registered') || errMsg.includes('user already exists');
                const isRateLimit = errMsg.includes('rate') || errMsg.includes('limit') || errStatus === 429 || errStatus === 422;

                if (isAlreadyRegistered || isRateLimit) {
                    // Intentar signIn para obtener user_id (puede que ya esté registrado)
                    finalIsRecurring = isAlreadyRegistered;
                    const { data: signInData } = await supabase.auth.signInWithPassword({
                        email: data.customer_email,
                        password: tempPassword,
                    });
                    if (signInData?.user) {
                        newUserId = signInData.user.id;
                    }
                } else {
                    // Error real del servidor → lo propagamos
                    throw new Error(`Error al crear la cuenta: ${signUpError.message}`);
                }
            } else if (authData?.user) {
                // Usuario NUEVO creado correctamente
                newUserId = authData.user.id;
                finalIsRecurring = false;
                console.log('[useBooking] nuevo usuario creado:', authData.user.id);
            } else {
                // signUp sin error pero sin usuario (email ya confirmado vs. deshabilitado?)
                console.warn('[useBooking] signUp sin error pero user es null');
            }

            // ── PASO 2: Guardar la reserva en la base de datos ────────────────────────────
            // Convertir Date objects a strings 'YYYY-MM-DD' para evitar problemas de timezone
            const datesAsStrings = selectedDates.map(d => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            });
            const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_booking_transaction', {
                p_tour_id: tour.id,
                p_dates: datesAsStrings,
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
                p_user_id: newUserId,
            });

            if (rpcError) throw rpcError;

            const resultObj = rpcData as any;
            if (resultObj?.is_recurring_customer !== undefined) {
                finalIsRecurring = !!resultObj.is_recurring_customer;
            }
            setIsRecurring(finalIsRecurring);

            // ── PASO 3: Generar link de WhatsApp ──────────────────────────────────────────
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

    return { submitBooking, submitted, submitError, whatsAppUrl, isRecurring, tempPassword, customerEmail };
}
