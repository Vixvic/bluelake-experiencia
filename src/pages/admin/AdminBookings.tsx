import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Search, FileDown, Plus, Mail, Trash2, Link as LinkIcon, ExternalLink, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminCorporate from './AdminCorporate';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  document_type: string;
  document_number: string;
  dates: string[];
  adults: number;
  children: number;
  total_amount: number;
  payment_method: string;
  payment_mode: string;
  status: string;
  created_at: string;
  tour_id: string;
  tours?: { title_es: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500',
];

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getReservationId(index: number, total: number) {
  return `#RES-${(total - index + 2800).toString().padStart(4, '0')}`;
}

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<{ id: string; title_es: string }[]>([]);
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tourFilter, setTourFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const fetchBookings = () => {
    setLoading(true);
    supabase
      .from('bookings')
      .select('*, tours(title_es)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings((data || []) as Booking[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
    supabase.from('tours').select('id, title_es').then(({ data }) => {
      if (data) setTours(data);
    });
  }, []);

  // Apply filters
  const filtered = bookings.filter(b => {
    if (searchQuery && !b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) && !b.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (tourFilter !== 'all' && b.tour_id !== tourFilter) return false;
    if (dateFilter) {
      const bookingDate = format(new Date(b.created_at), 'yyyy-MM-dd');
      if (bookingDate !== dateFilter) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const showingTo = Math.min(currentPage * perPage, filtered.length);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, dateFilter, tourFilter, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    fetchBookings();
    if (status === 'confirmed') {
        toast({
            title: "Pago Confirmado",
            description: "Puedes copiar el enlace del Itinerario ahora.",
        });
    }
  };

  const copyVoucherLink = (id: string) => {
    const link = `${window.location.origin}/bluelake-experiencia/client/itinerary/${id}`;
    navigator.clipboard.writeText(link);
    toast({
        title: "Enlace Copiado",
        description: "El enlace al Voucher ha sido copiado al portapapeles.",
    });
  };

  const handleOpenWhatsApp = (booking: Booking, reservationId: string) => {
    const phone = booking.customer_phone;
    const name = booking.customer_name;
    if (!phone) {
        toast({
            variant: "destructive",
            title: "Teléfono no disponible",
            description: "El cliente no proporcionó un número de teléfono.",
        });
        return;
    }
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Generate text message
    const dateList = booking.dates?.map(d => format(new Date(d), 'dd/MM/yyyy', { locale: es })).join(', ') || '';
    const portalUrl = `${window.location.origin}/bluelake-experiencia/login`;

    const message = encodeURIComponent(
        `🌿 *RESERVA BLUELAKE EXPERIENCIA* 🌿\n` +
        `Hola ${name},\n\n` +
        `Nos comunicamos para enviarte los detalles actualizados de tu reserva:\n\n` +
        `📋 *Código:* ${reservationId}\n` +
        `🎯 *Experiencia:* ${booking.tours?.title_es || 'Tour'}\n` +
        `📅 *Fecha(s):* ${dateList}\n` +
        `👥 *Viajeros:* ${booking.adults + booking.children} persona(s)\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🔐 *ACCESO A TU PANEL*\n` +
        `🌐 ${portalUrl}\n` +
        `📧 Correo: ${booking.customer_email}\n` +
        `🔑 Clave temporal: Bluelake${booking.document_number || ''} *(o tu clave personal si ya la actualizaste)*\n\n` +
        `¡Gracias por confiar en nosotros! 🙏`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleOpenEmail = (email: string, name: string) => {
    if (!email) {
        toast({
            variant: "destructive",
            title: "Email no disponible",
            description: "El cliente no proporcionó un correo electrónico.",
        });
        return;
    }
    const subject = encodeURIComponent('Consulta sobre tu reserva en Bluelake Experiencia');
    const body = encodeURIComponent(`Hola ${name},\n\nNos comunicamos de Bluelake Experiencia con respecto a tu reserva...\n\n`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Cliente', 'Email', 'Teléfono', 'Documento', 'Tour', 'Fechas', 'Adultos', 'Niños', 'Total', 'Método Pago', 'Modo Pago', 'Estado', 'Creado'].join(','),
      ...filtered.map((b, i) => [
        getReservationId(i, filtered.length),
        `"${b.customer_name}"`, b.customer_email, b.customer_phone || '',
        `${b.document_type || ''}:${b.document_number || ''}`,
        `"${b.tours?.title_es || ''}"`,
        `"${b.dates?.join('; ') || ''}"`,
        b.adults, b.children, b.total_amount,
        b.payment_method, b.payment_mode, b.status,
        format(new Date(b.created_at), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-bluelake-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Reservas</h1>
          <p className="text-sm text-muted-foreground">Administra todas las reservas, pagos y estados de clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Nueva Reserva Manual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reservas" className="w-full">
        <TabsList className="mb-0 relative w-fit h-fit p-1 bg-slate-100 rounded-xl space-x-1">
          <TabsTrigger value="reservas" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-medium transition-all">Reservas Individuales</TabsTrigger>
          <TabsTrigger value="corporativas" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-medium transition-all">Solicitudes Corporativas</TabsTrigger>
        </TabsList>

        <TabsContent value="reservas" className="space-y-6 m-0 pt-6 focus-visible:outline-none">
          {/* Filters */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Buscar Cliente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre o email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Rango de Fechas</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tipo de Tour</label>
                <select
                  value={tourFilter}
                  onChange={e => setTourFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todos los Tours</option>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title_es}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Estado de Pago</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando reservas...</div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      {['ID RESERVA', 'CLIENTE', 'TOUR & FECHA', 'PERSONAS', 'TOTAL', 'ESTADO', 'PAGO'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map((b, i) => (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-muted-foreground whitespace-nowrap text-xs">
                          {getReservationId(i + (currentPage - 1) * perPage, filtered.length)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${getAvatarColor(b.customer_name)} flex items-center justify-center shrink-0`}>
                              <span className="text-white text-xs font-bold">{getInitials(b.customer_name)}</span>
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{b.customer_name}</div>
                              <div className="text-xs text-muted-foreground">{b.customer_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-foreground">{b.tours?.title_es || 'Tour'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            📅 {format(new Date(b.created_at), 'dd MMM, yyyy', { locale: es })}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-foreground">
                          {b.adults + b.children} {b.adults + b.children === 1 ? 'Adulto' : 'Personas'}
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">
                          S/ {b.total_amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-secondary text-foreground'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {STATUS_LABELS[b.status] || b.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {b.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(b.id, 'confirmed')}
                                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                                  title="Confirmar"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(b.id, 'cancelled')}
                                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                  title="Cancelar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {b.status === 'confirmed' && (
                              <>
                                <button 
                                  onClick={() => copyVoucherLink(b.id)}
                                  className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors" 
                                  title="Copiar Link del Voucher"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </button>
                                <a 
                                  href={`/bluelake-experiencia/client/itinerary/${b.id}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" 
                                  title="Ver Voucher en Nueva Pestaña"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </>
                            )}

                            {/* Botones de Contacto (Siempre visibles) */}
                            <button 
                              onClick={() => handleOpenWhatsApp(b, getReservationId(i + (currentPage - 1) * perPage, filtered.length))}
                              className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors" 
                              title="Enviar recordatorio de reserva por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenEmail(b.customer_email, b.customer_name)}
                              className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" 
                              title="Enviar Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, 'cancelled')}
                              className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-muted-foreground transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                          No se encontraron reservas con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {showingFrom} a {showingTo} de <strong>{filtered.length}</strong> resultados
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      ‹ Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      Next ›
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="corporativas" className="m-0 pt-6 focus-visible:outline-none">
          <AdminCorporate />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBookings;
