import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Clock, Users, CheckCircle2, AlertCircle, Loader2, LogOut, User, MapPin, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BLUELAKE_WP = '51996130193';

interface Booking {
    id: string;
    tour_id: string;
    dates: string[];
    adults: number;
    children: number;
    total_amount: number;
    payment_mode: string;
    payment_method: string;
    status: string;
    created_at: string;
    notes: string | null;
    tours: { title_es: string; image_url: string; category: string } | null;
}

interface Profile {
    full_name: string;
    role: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pendiente de pago', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4" /> },
    confirmed: { label: 'Confirmada', color: 'text-jungle bg-jungle/10 border-jungle/30', icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled: { label: 'Cancelada', color: 'text-destructive bg-destructive/10 border-destructive/20', icon: <AlertCircle className="w-4 h-4" /> },
};

const ClientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/client/login'); return; }

            const [{ data: profileData }, { data: bookingData }] = await Promise.all([
                supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
                supabase
                    .from('bookings')
                    .select('*, tours(title_es, image_url, category)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
            ]);

            setProfile(profileData);
            setBookings(bookingData || []);
            setLoading(false);
        };
        loadData();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const buildSupportMessage = (b: Booking) => {
        const tourName = b.tours?.title_es || 'Tour';
        const id = b.id.slice(-6).toUpperCase();
        const msg = `Hola Bluelake 👋, soy ${profile?.full_name} y tengo una consulta sobre mi reserva #${id} (${tourName}).`;
        return `https://wa.me/${BLUELAKE_WP}?text=${encodeURIComponent(msg)}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img
                            src="/bluelake-experiencia/logo-bluelake.png"
                            alt="Bluelake"
                            className="h-8"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="font-black text-foreground text-sm hidden sm:block">Portal Cliente</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/client/profile"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">{profile?.full_name?.split(' ')[0] || 'Perfil'}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-foreground">
                        ¡Hola, {profile?.full_name?.split(' ')[0] || 'viajero'}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">Aquí puedes ver el estado de tus experiencias reservadas.</p>
                </div>

                {/* Bookings */}
                {bookings.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                        <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-foreground font-semibold">No tienes reservas activas</p>
                        <p className="text-sm text-muted-foreground mt-1">¡Explora nuestras experiencias y vive la Amazonía!</p>
                        <Link
                            to="/#experiencias"
                            className="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition"
                        >
                            Ver experiencias
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => {
                            const status = statusConfig[booking.status] || statusConfig.pending;
                            const firstDate = booking.dates?.[0];
                            const tourTitle = booking.tours?.title_es || 'Experiencia';
                            const tourImg = booking.tours?.image_url;
                            const bookingRef = `#${booking.id.slice(-6).toUpperCase()}`;

                            return (
                                <div key={booking.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex">
                                        {/* Tour image */}
                                        {tourImg && (
                                            <div className="w-28 sm:w-40 shrink-0">
                                                <img src={tourImg} alt={tourTitle} className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-mono">{bookingRef}</p>
                                                        <h3 className="font-bold text-foreground text-base leading-tight">{tourTitle}</h3>
                                                        {booking.tours?.category && (
                                                            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3" />{booking.tours.category}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {firstDate && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {format(new Date(firstDate + 'T00:00:00'), "dd 'de' MMMM yyyy", { locale: es })}
                                                        {booking.dates.length > 1 && ` (+${booking.dates.length - 1} más)`}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {booking.adults} adulto{booking.adults > 1 ? 's' : ''}
                                                    {booking.children > 0 ? ` + ${booking.children} niño${booking.children > 1 ? 's' : ''}` : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <span className="text-lg font-bold text-primary">S/ {booking.total_amount?.toFixed(2)}</span>
                                                <a
                                                    href={buildSupportMessage(booking)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:underline"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    Consultar por WhatsApp
                                                </a>
                                            </div>

                                            {booking.status === 'pending' && (
                                                <div className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg p-2.5">
                                                    ⏳ <strong>Pago pendiente.</strong> Envía tu comprobante de pago por WhatsApp para confirmar tu reserva.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Quick actions */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        to="/#experiencias"
                        className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary transition-colors group"
                    >
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">+ Reservar otra experiencia</p>
                    </Link>
                    <Link
                        to="/client/profile"
                        className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary transition-colors group"
                    >
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">Cambiar mi contraseña</p>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
