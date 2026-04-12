import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ChevronLeft, MapPin, Calendar, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsolidatedBooking {
    id: string;
    dates: string[];
    adults: number;
    children: number;
    total_amount: number;
    status: string;
    payment_method: string;
    customer_name: string;
    customer_email: string;
    document_type: string;
    document_number: string;
    tours: { title_es: string; image_url: string; category: string } | null;
}

const ConsolidatedVoucher: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<ConsolidatedBooking[]>([]);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            setUserEmail(user.email || '');

            const [{ data: profileData }, { data: bookingData }] = await Promise.all([
                supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
                supabase
                    .from('bookings')
                    .select('*, tours(title_es, image_url, category)')
                    .eq('user_id', user.id)
                    .in('status', ['pending', 'confirmed'])
                    .order('created_at', { ascending: false }),
            ]);

            const userName = profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
            setUserName(userName);

            // Filtrar solo reservas con fechas futuras
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureBookings = (bookingData || []).filter((b: any) => {
                return (b.dates || []).some((d: string) => {
                    const bDate = new Date(d + 'T00:00:00');
                    return bDate >= today;
                });
            });

            setBookings(futureBookings as ConsolidatedBooking[]);
            setLoading(false);
        };
        load();
    }, [navigate]);

    const handleDownloadPdf = async () => {
        if (!printRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Voucher-Consolidado-Bluelake.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            setDownloading(false);
        }
    };

    const grandTotal = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalPassengers = bookings.reduce((sum, b) => sum + b.adults + b.children, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Cargando tu voucher consolidado...</p>
            </div>
        );
    }

    if (bookings.length < 2) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-foreground">No hay reservas suficientes</h2>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    Necesitas al menos 2 reservas activas con fechas futuras para generar un voucher consolidado.
                </p>
                <Button asChild>
                    <Link to="/client/dashboard">Volver al Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/30 pb-20 pt-8 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
                <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/50">
                    <Link to="/client/dashboard">
                        <ChevronLeft className="w-4 h-4" />
                        Volver
                    </Link>
                </Button>
                <Button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md rounded-full px-6"
                >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generando...' : 'Descargar PDF'}
                </Button>
            </div>

            <div className="max-w-3xl mx-auto" ref={printRef}>
                {/* VOUCHER CONSOLIDADO */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-border/60 overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 px-6 sm:px-8 py-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider border border-white/20">
                                        Voucher Consolidado
                                    </span>
                                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                                        Bluelake Experiencia
                                    </h1>
                                    <p className="text-white/70 text-sm mt-1">{bookings.length} experiencias · {totalPassengers} pasajeros</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl text-center min-w-[100px]">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">TOTAL</p>
                                    <p className="text-white font-black text-xl">S/ {grandTotal.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Titular */}
                    <div className="px-6 sm:px-8 py-5 bg-secondary/20 border-b border-border/60">
                        <div className="flex flex-wrap gap-x-8 gap-y-2">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Titular</p>
                                <p className="font-bold text-foreground text-lg">{userName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email</p>
                                <p className="font-medium text-foreground">{userEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Segmentos de reservas */}
                    <div className="divide-y divide-dashed divide-border/60">
                        {bookings.map((booking, idx) => {
                            const firstDate = booking.dates?.[0];
                            const displayDate = firstDate
                                ? format(new Date(firstDate + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })
                                : 'Por confirmar';
                            const statusLabel = booking.status === 'confirmed' ? 'Confirmada' : 'Pendiente';
                            const statusColor = booking.status === 'confirmed' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                            const shortId = booking.id.slice(-6).toUpperCase();

                            return (
                                <div key={booking.id} className="px-6 sm:px-8 py-5">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground text-base leading-tight">
                                                    {booking.tours?.title_es || 'Experiencia'}
                                                </h3>
                                                {booking.tours?.category && (
                                                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3" />{booking.tours.category}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusColor}`}>
                                            {booking.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground ml-11">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />{displayDate}
                                            {booking.dates?.length > 1 && ` (+${booking.dates.length - 1})`}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {booking.adults} adulto{booking.adults > 1 ? 's' : ''}
                                            {booking.children > 0 ? ` + ${booking.children} niño${booking.children > 1 ? 's' : ''}` : ''}
                                        </span>
                                        <span className="font-bold text-primary">S/ {(booking.total_amount || 0).toFixed(2)}</span>
                                        <span className="text-[11px] font-mono text-muted-foreground/60">#{shortId}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen y QR */}
                    <div className="px-6 sm:px-8 py-6 border-t border-border/60 flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-foreground">Total general</span>
                                <span className="text-2xl font-black text-primary">S/ {grandTotal.toFixed(2)}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                                <p className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                                    Importante
                                </p>
                                <ul className="space-y-1 pl-4 list-disc marker:text-slate-300">
                                    <li>Llegar 15 min antes del tiempo pactado.</li>
                                    <li>Llevar ropa ligera, repelente y bloqueador solar.</li>
                                    <li>DNI / Pasaporte original en mano.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="text-center shrink-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Escanea para verificar</p>
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-border/50 inline-block">
                                <QRCode
                                    value={`https://vixvic.github.io/bluelake-experiencia/client/dashboard`}
                                    size={120}
                                    fgColor="#0f172a"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-900 px-8 py-4 text-center">
                        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Operado orgullosamente por Bluelake Experiencia</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedVoucher;
