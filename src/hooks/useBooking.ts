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
                // Si el error es que el correo ya existe → es un cliente recurrente
                const isAlreadyRegistered =
                    signUpError.message.toLowerCase().includes('already registered') ||
                    signUpError.message.toLowerCase().includes('user already exists');

                if (isAlreadyRegistered) {
                    // Es recurrente: intentamos obtener su user_id vía signIn
                    finalIsRecurring = true;
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
            }

            // ── PASO 2: Guardar la reserva en la base de datos ────────────────────────────
            const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_booking_transaction', {
                p_tour_id: tour.id,
                p_dates: selectedDates,
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
