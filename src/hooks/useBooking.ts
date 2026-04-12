import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    BookingTour,
    BookingFormData,
    PendingBookingSummary,
    buildWhatsAppMessage,
    buildConsolidatedWhatsAppMessage,
    BLUELAKE_WP,
} from '@/utils/whatsapp-helper';

interface UseBookingResult {
    submitBooking: (data: BookingFormData, selectedDates: Date[], tour: BookingTour, total: number, toPay: number) => Promise<void>;
    submitted: boolean;
    submitError: string;
    whatsAppUrl: string;
    isRecurring: boolean;
    hasActiveSession: boolean;
    tempPassword: string;
    customerEmail: string;
    previousBookings: PendingBookingSummary[];
}

export function useBooking(): UseBookingResult {
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [whatsAppUrl, setWhatsAppUrl] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [hasActiveSession, setHasActiveSession] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [previousBookings, setPreviousBookings] = useState<PendingBookingSummary[]>([]);

    const submitBooking = async (data: BookingFormData, selectedDates: Date[], tour: BookingTour, total: number, toPay: number) => {
        setSubmitError('');
        try {
            // ═══════════════════════════════════════════════════════════════════════
            // PASO 0: Preparar datos
            // ═══════════════════════════════════════════════════════════════════════
            const pwd = `Bluelake${data.document_number}`;
            setTempPassword(pwd);
            setCustomerEmail(data.customer_email);

            let userId: string | null = null;
            let recurring = false;
            let sessionActive = false;

            // Convertir fechas Date → strings 'YYYY-MM-DD' (evita problemas de timezone)
            const dateStrings = selectedDates.map(d => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            });

            console.log('[BL] ── Inicio de reserva ──');
            console.log('[BL] Email:', data.customer_email, '| DNI:', data.document_number);
            console.log('[BL] Fechas:', dateStrings);

            // ═══════════════════════════════════════════════════════════════════════
            // PASO 0.5: Verificar si ya hay sesión activa
            // ═══════════════════════════════════════════════════════════════════════
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session?.user) {
                    userId = sessionData.session.user.id;
                    sessionActive = true;
                    recurring = true;
                    console.log('[BL] Sesión activa detectada, user_id:', userId);
                }
            } catch (sessionErr) {
                console.warn('[BL] Error verificando sesión:', sessionErr);
            }

            // ═══════════════════════════════════════════════════════════════════════
            // PASO 1: Crear cuenta (signUp) — Solo si NO hay sesión activa
            // ═══════════════════════════════════════════════════════════════════════
            if (!sessionActive) {
                try {
                    console.log('[BL] PASO 1: Intentando signUp...');
                    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
                        email: data.customer_email,
                        password: pwd,
                        options: {
                            data: {
                                full_name: data.customer_name,
                                document_type: data.document_type,
                                document_number: data.document_number,
                                phone: data.customer_phone,
                            },
                        },
                    });

                    if (signUpErr) {
                        console.warn('[BL] signUp falló:', signUpErr.status, signUpErr.message);

                        // Intentar signIn para obtener user_id del usuario existente
                        const msg = signUpErr.message.toLowerCase();
                        if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
                            recurring = true;
                            console.log('[BL] → Usuario ya existe, intentando signIn...');
                            try {
                                const { data: loginData } = await supabase.auth.signInWithPassword({
                                    email: data.customer_email,
                                    password: pwd,
                                });
                                if (loginData?.user) {
                                    userId = loginData.user.id;
                                    console.log('[BL] → signIn OK, user_id:', userId);
                                } else {
                                    console.warn('[BL] → signIn no devolvió usuario');
                                }
                            } catch (signInErr) {
                                console.warn('[BL] → signIn falló:', signInErr);
                            }
                        } else {
                            // Otro error (rate limit, network, etc.) — seguimos sin user_id
                            console.warn('[BL] → Error no-recoverable en signUp, continuamos sin user_id');
                        }
                    } else if (authData?.user) {
                        userId = authData.user.id;
                        recurring = false;
                        console.log('[BL] signUp OK, nuevo user_id:', userId);
                    } else {
                        // signUp sin error pero sin user (usuario ya existe con confirm pendiente)
                        console.warn('[BL] signUp sin error y sin user — posible usuario fantasma');
                    }
                } catch (authCrash) {
                    // Si signUp crashea completamente, no detenemos la reserva
                    console.error('[BL] signUp crasheó:', authCrash);
                }
            }

            console.log('[BL] PASO 1 completado. user_id:', userId || 'NULL', '| recurrente:', recurring, '| sesión activa:', sessionActive);

            // ═══════════════════════════════════════════════════════════════════════
            // PASO 2: Guardar la reserva — SIEMPRE debe ejecutarse
            // ═══════════════════════════════════════════════════════════════════════
            console.log('[BL] PASO 2: Llamando RPC create_booking_transaction...');

            const rpcParams = {
                p_tour_id: tour.id,
                p_dates: dateStrings,
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
                p_user_id: userId,
            };

            console.log('[BL] RPC params:', JSON.stringify(rpcParams, null, 2));

            const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
                'create_booking_transaction',
                rpcParams
            );

            if (rpcError) {
                console.error('[BL] RPC ERROR:', rpcError.message, rpcError.code, rpcError.details);
                throw new Error(`Error al guardar la reserva: ${rpcError.message}`);
            }

            console.log('[BL] RPC OK:', JSON.stringify(rpcResult));

            // Actualizar estado
            const result = rpcResult as any;
            if (result?.is_recurring_customer !== undefined) {
                recurring = !!result.is_recurring_customer;
            }
            setIsRecurring(recurring);
            setHasActiveSession(sessionActive);

            // ═══════════════════════════════════════════════════════════════════════
            // PASO 3: Consultar reservas previas pendientes del mismo email
            // ═══════════════════════════════════════════════════════════════════════
            let pendingBookings: PendingBookingSummary[] = [];
            try {
                console.log('[BL] PASO 3: Consultando reservas previas...');
                const { data: pendingData, error: pendingError } = await (supabase.rpc as any)(
                    'get_customer_pending_bookings',
                    { p_email: data.customer_email }
                );

                if (!pendingError && pendingData) {
                    pendingBookings = Array.isArray(pendingData) ? pendingData : (pendingData ? [pendingData] : []);
                    console.log('[BL] Reservas pendientes encontradas:', pendingBookings.length);
                } else if (pendingError) {
                    // La RPC puede no existir todavía, no interrumpimos
                    console.warn('[BL] RPC get_customer_pending_bookings no disponible:', pendingError.message);
                }
            } catch (rpcPendingErr) {
                console.warn('[BL] Error consultando reservas pendientes:', rpcPendingErr);
            }
            setPreviousBookings(pendingBookings);

            // ═══════════════════════════════════════════════════════════════════════
            // PASO 4: WhatsApp — Individual o Consolidado
            // ═══════════════════════════════════════════════════════════════════════
            const bookingCode = result?.booking_id || 'BL' + Date.now();

            if (pendingBookings.length > 1) {
                // Mensaje consolidado: el cliente tiene múltiples reservas activas
                console.log('[BL] Generando mensaje WhatsApp CONSOLIDADO');
                const message = buildConsolidatedWhatsAppMessage(
                    data.customer_name,
                    data.customer_email,
                    pendingBookings,
                    recurring,
                    recurring ? null : pwd
                );
                setWhatsAppUrl(`https://wa.me/${BLUELAKE_WP}?text=${message}`);
            } else {
                // Mensaje individual normal
                console.log('[BL] Generando mensaje WhatsApp INDIVIDUAL');
                const message = buildWhatsAppMessage(
                    tour, data, selectedDates, total, toPay,
                    data.customer_email,
                    recurring ? null : pwd,
                    bookingCode,
                    recurring
                );
                setWhatsAppUrl(`https://wa.me/${BLUELAKE_WP}?text=${message}`);
            }

            setSubmitted(true);
            console.log('[BL] ── Reserva completada exitosamente ──');

        } catch (err: any) {
            console.error('[BL] ERROR FINAL:', err);
            setSubmitError(err.message || 'Ocurrió un error guardando la reserva. Por favor intenta de nuevo.');
        }
    };

    return {
        submitBooking,
        submitted,
        submitError,
        whatsAppUrl,
        isRecurring,
        hasActiveSession,
        tempPassword,
        customerEmail,
        previousBookings,
    };
}
