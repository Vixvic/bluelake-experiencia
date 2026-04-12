import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface BookingTour {
    id: string;
    slug?: string;
    title_es: string;
    title_en: string;
    base_price: number;
    child_price?: number | null;
    max_capacity: number;
    current_bookings: number;
    category?: string;
    season?: string;
    image_url?: string;
}

export interface BookingFormData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    document_type: string;
    document_number: string;
    adults: number;
    children: number;
    payment_method: 'transfer' | 'yape' | 'plin' | 'card';
    payment_mode: 'full' | 'partial';
    notes?: string;
}

export interface PendingBookingSummary {
    id: string;
    dates: string[];
    adults: number;
    children: number;
    total_amount: number;
    payment_method: string;
    payment_mode: string;
    status: string;
    title_es: string;
    title_en?: string;
    category?: string;
}

export const BLUELAKE_WP = '51996130193'; // sin + ni espacios

/** Recargo aplicado al monto cuando el cliente elige pago con tarjeta */
export const CARD_FEE_RATE = 0.06;

export function buildWhatsAppMessage(
    tour: BookingTour,
    data: BookingFormData,
    dates: Date[],
    total: number,
    toPay: number,
    clientEmail: string,
    clientPassword: string | null,
    reservationCode: string,
    isRecurring: boolean
): string {
    const dateList = dates.map(d => format(d, 'dd/MM/yyyy', { locale: es })).join(', ');
    const methodLabels: Record<string, string> = {
        transfer: 'Transferencia bancaria',
        yape: 'Yape',
        plin: 'Plin',
        card: 'Tarjeta (+6%)',
    };
    const method = methodLabels[data.payment_method] || data.payment_method;
    const mode = data.payment_mode === 'partial' ? 'Pago parcial (50%)' : 'Pago completo';
    const portalUrl = `https://vixvic.github.io/bluelake-experiencia/login`;

    let accessMessage = '';
    if (isRecurring) {
        accessMessage = `🔐 *ACCESO A TU PANEL*\n` +
                        `🌐 ${portalUrl}\n` +
                        `Ya tienes una cuenta registrada previamente con este correo (${clientEmail}). Ingresa con tu contraseña habitual.\n` +
                        `(Si la olvidaste, puedes usar la opción de recuperar contraseña).`;
    } else {
        accessMessage = `🔐 *ACCESO A TU PANEL*\n` +
                        `🌐 ${portalUrl}\n` +
                        `📧 Usuario: ${clientEmail}\n` +
                        `🔑 Contraseña temporal: ${clientPassword}\n` +
                        `*(Te recomendamos cambiarla al ingresar por primera vez)*`;
    }

    return encodeURIComponent(
        `🌿 *RESERVA BLUELAKE EXPERIENCIA* 🌿\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *Código:* #${reservationCode.slice(-6).toUpperCase()}\n` +
        `🎯 *Experiencia:* ${tour.title_es}\n` +
        `📅 *Fecha(s):* ${dateList}\n` +
        `👥 *Viajeros:* ${data.adults} adulto(s)${data.children > 0 ? ` + ${data.children} niño(s)` : ''}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total:* S/ ${total.toFixed(2)}\n` +
        `💳 *Modalidad:* ${mode}\n` +
        `📤 *A pagar ahora:* S/ ${toPay.toFixed(2)}\n` +
        `🏦 *Método:* ${method}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Cliente:* ${data.customer_name}\n` +
        `📧 *Email:* ${data.customer_email}\n` +
        `📱 *Teléfono:* ${data.customer_phone}\n` +
        `🪪 *Documento:* ${data.document_type} ${data.document_number}\n` +
        (data.notes ? `📝 *Notas:* ${data.notes}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━\n` +
        accessMessage + `\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Responde este mensaje enviando tu comprobante de pago para confirmar tu reserva. ¡Gracias! 🙏`
    );
}

/**
 * Genera un mensaje WhatsApp consolidado cuando el cliente tiene múltiples reservas activas.
 */
export function buildConsolidatedWhatsAppMessage(
    customerName: string,
    customerEmail: string,
    bookings: PendingBookingSummary[],
    isRecurring: boolean,
    clientPassword: string | null
): string {
    const portalUrl = `https://vixvic.github.io/bluelake-experiencia/login`;
    const methodLabels: Record<string, string> = {
        transfer: 'Transferencia bancaria',
        yape: 'Yape',
        plin: 'Plin',
        card: 'Tarjeta (+6%)',
    };

    let bookingLines = '';
    let grandTotal = 0;

    bookings.forEach((b, i) => {
        const dateList = (b.dates || []).map(d => {
            try {
                return format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy', { locale: es });
            } catch {
                return d;
            }
        }).join(', ');
        grandTotal += b.total_amount || 0;

        bookingLines += `\n📌 *RESERVA ${i + 1}:* ${b.title_es}\n` +
            `   📅 ${dateList} | 👥 ${b.adults} adulto(s)${b.children > 0 ? ` + ${b.children} niño(s)` : ''} | 💰 S/ ${(b.total_amount || 0).toFixed(2)}\n`;
    });

    let accessMessage = '';
    if (isRecurring) {
        accessMessage = `🔐 *ACCESO A TU PANEL*\n` +
                        `🌐 ${portalUrl}\n` +
                        `Ingresa con tu correo (${customerEmail}) y tu contraseña habitual.`;
    } else {
        accessMessage = `🔐 *ACCESO A TU PANEL*\n` +
                        `🌐 ${portalUrl}\n` +
                        `📧 Usuario: ${customerEmail}\n` +
                        `🔑 Contraseña temporal: ${clientPassword}\n` +
                        `*(Te recomendamos cambiarla al ingresar por primera vez)*`;
    }

    return encodeURIComponent(
        `🌿 *RESERVAS BLUELAKE EXPERIENCIA* 🌿\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Cliente:* ${customerName}\n` +
        `📧 *Email:* ${customerEmail}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        bookingLines +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *TOTAL GENERAL:* S/ ${grandTotal.toFixed(2)}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        accessMessage + `\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Responde este mensaje enviando tu(s) comprobante(s) de pago para confirmar tus reservas. ¡Gracias! 🙏`
    );
}
