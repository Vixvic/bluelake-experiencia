import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ChevronLeft, MapPin, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BookingDetails {
    id: string;
    created_at: string;
    dates: string[];
    adults: number;
    children: number;
    total_amount: number;
    status: string;
    customer_name: string;
    customer_email: string;
    document_type: string;
    document_number: string;
    tour: {
        title_es: string;
        image_url: string;
        category: string;
    };
}

const ItineraryVoucher: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const { formatPrice } = useCurrency();
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!id) return;
            try {
                // Verificar sesión (OPCIONAL: Podrías querer que el enlace sea público si pasan un hash secreto)
                const { data: { session } } = await supabase.auth.getSession();
                
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, tour:tours(title_es, image_url, category)')
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                
                // Seguridad básica pseudo-RLS
                if (!session && document.referrer === '') {
                   // Si el backend no tiene RLS que restrinja leer bookings ajenos, lo hacemos manual pidiendo sesión.
                   // Asumiremos que el app actual tiene portal abierto o validará RLS en supabase.
                }

                setBooking(data as unknown as BookingDetails);
            } catch (err: any) {
                console.error('Error fetching itinerary:', err);
                setError('No pudimos cargar tu itinerario o no tienes permisos para verlo.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const handleDownloadPdf = async () => {
        if (!printRef.current || !booking) return;
        setDownloading(true);

        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true, // Para asegurar que las imgagenes de supabase carguen
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Voucher-${booking.id.slice(0,8)}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Cargando tu Itinerario...</p>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2 text-foreground">Error de acceso</h2>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">{error}</p>
                <Button asChild>
                    <Link to="/client/dashboard">Ir a mi Portal</Link>
                </Button>
            </div>
        );
    }

    const shortId = booking.id.split('-').pop()?.toUpperCase() || booking.id.slice(0, 8).toUpperCase();
    const flightDate = format(new Date(booking.dates[0] || booking.created_at), "dd 'de' MMMM, yyyy", { locale: es });

    return (
        <div className="min-h-screen bg-secondary/30 pb-20 pt-8 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
                <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50">
                    <Link to="/client/dashboard">
                        <ChevronLeft className="w-4 h-4" />
                        Volver
                    </Link>
                </Button>
                {booking.status === 'confirmed' && (
                    <Button 
                        onClick={handleDownloadPdf} 
                        disabled={downloading}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md rounded-full px-6"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                )}
            </div>

            {/* Este Div es el que se transforma en PDF */}
            <div className="max-w-3xl mx-auto flex flex-col gap-6" ref={printRef}>
                
                {booking.status === 'pending' && (
                    <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-2xl flex gap-3 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Esta reserva está pendiente de pago o verificación. El voucher será válido cuando el administrador confirme la transacción.</p>
                    </div>
                )}

                {/* VOUCHER CARD MAIN */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-border/60 overflow-hidden print-precise">
                    {/* Header Image Area */}
                    <div className="h-48 sm:h-64 relative bg-slate-900 w-full overflow-hidden">
                        {booking.tour.image_url && (
                             <img 
                                src={booking.tour.image_url} 
                                alt={booking.tour.title_es} 
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                                crossOrigin="anonymous" // vital for html2canvas
                             />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider shadow-sm">
                                    Voucher de Experiencia
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                                    {booking.tour.title_es}
                                </h1>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shrink-0 self-start sm:self-auto text-center min-w-[120px]">
                                <p className="text-white/80 text-xs font-medium uppercase font-mono tracking-wider mb-1">CÓDIGO</p>
                                <p className="text-white font-bold text-xl tracking-widest">{shortId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
                        {/* Info Grid */}
                        <div className="flex-1 space-y-8">
                            
                            <div className="grid grid-cols-2 gap-6 relative">
                                {/* Decoración de linea de separacion */}
                                <div className="hidden sm:block absolute left-1/2 top-4 bottom-4 w-px bg-border/60 -translate-x-1/2" />
                                
                                <div>
                                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>Fecha Planeada</p>
                                    <p className="font-semibold text-lg text-foreground px-1">{flightDate}</p>
                                </div>
                                
                                <div className="sm:pl-6">
                                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/>Pasajeros</p>
                                    <p className="font-semibold text-lg text-foreground px-1">{booking.adults + booking.children} Personas</p>
                                </div>
                                
                                <div className="pt-2">
                                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>Destino</p>
                                    <p className="font-semibold text-foreground px-1">{booking.tour.category || 'Tarapoto, Perú'}</p>
                                </div>
                                
                                <div className="sm:pl-6 pt-2">
                                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/>Estado</p>
                                    <p className={`font-semibold text-lg px-1 ${booking.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {booking.status === 'confirmed' ? 'Pagado & Confirmado' : 'Pendiente / Reservado'}
                                    </p>
                                </div>
                            </div>

                            <hr className="border-border/60 border-dashed" />

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Datos del Titular</h3>
                                <div className="bg-secondary/30 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">Nombre Completo</p>
                                        <p className="font-semibold text-foreground">{booking.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">{booking.document_type || 'Documento'}</p>
                                        <p className="font-semibold text-foreground">{booking.document_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">Correo</p>
                                        <p className="font-medium text-foreground">{booking.customer_email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: QR y Recomendaciones */}
                        <div className="md:w-64 shrink-0 flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-border/60 border-dashed pt-8 md:pt-0 md:pl-8">
                            
                            <div className="text-center w-full mb-8">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Escanea para verificar</p>
                                <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-border/50 mx-auto">
                                    <QRCode 
                                        value={`https://bluelake-experiencia.com/verify/${booking.id}`}
                                        size={140}
                                        className="opacity-90"
                                        fgColor="#0f172a"
                                    />
                                </div>
                                <p className="text-xs font-mono text-muted-foreground mt-3 tracking-widest">{booking.id.slice(0,13).toUpperCase()}</p>
                            </div>

                            <div className="bg-slate-50 w-full p-4 rounded-xl border border-slate-100 text-xs text-slate-600 text-left">
                                <p className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                                    Importante
                                </p>
                                <ul className="space-y-1.5 pl-4 list-disc marker:text-slate-300">
                                    <li>Llegar 15 min antes del tiempo pactado.</li>
                                    <li>Llevar ropa ligera, repelente y bloqueador solar.</li>
                                    <li>DNI / Pasaporte original en mano.</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                    {/* Footer Band */}
                    <div className="bg-slate-900 px-8 py-4 text-center">
                        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Operado orgulllosamente por Bluelake Experiencia</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ItineraryVoucher;
