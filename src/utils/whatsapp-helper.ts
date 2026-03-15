import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface BookingTour {
    id: string;
    title_es: string;
    title_en: string;
    base_price: number;
    child_price?: number | null;
    max_capacity: number;
    current_bookings: number;
    category: string;
    season: string;
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
    payment_method: 'transfer' | 'yape_plin';
    payment_mode: 'full' | 'partial';
    notes?: string;
}

export const BLUELAKE_WP = '51996130193'; // sin + ni espacios

export function generatePassword(length = 10): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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
    const method = data.payment_method === 'transfer' ? 'Transferencia bancaria' : 'Yape/Plin';
    const mode = data.payment_mode === 'partial' ? 'Pago parcial (50%)' : 'Pago completo';
    const portalUrl = `https://vixvic.github.io/bluelake-experiencia/client/login`;

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
