import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Users, TrendingUp, TrendingDown, Search, SlidersHorizontal, FileDown, Plus, Droplets, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  adults: number;
  children: number;
  total_amount: number;
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

const AdminDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ todayCount: 0, yesterdayCount: 0, monthRevenue: 0, lastMonthRevenue: 0, occupationPct: 0 });
  const [seasonMode, setSeasonMode] = useState('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 3;

  useEffect(() => {
    // Fetch recent bookings
    supabase
      .from('bookings')
      .select('*, tours(title_es)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setBookings(data as Booking[]);
      });

    // Fetch stats
    supabase.from('bookings').select('status, created_at, total_amount').then(({ data }) => {
      if (!data) return;
      const now = new Date();
      const today = now.toDateString();
      const yesterday = new Date(now.getTime() - 86400000).toDateString();
      const month = now.getMonth();
      const year = now.getFullYear();
      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;

      const todayCount = data.filter(b => new Date(b.created_at).toDateString() === today).length;
      const yesterdayCount = data.filter(b => new Date(b.created_at).toDateString() === yesterday).length;

      const monthRevenue = data
        .filter(b => {
          const d = new Date(b.created_at);
          return d.getMonth() === month && d.getFullYear() === year && b.status !== 'cancelled';
        })
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const lastMonthRevenue = data
        .filter(b => {
          const d = new Date(b.created_at);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && b.status !== 'cancelled';
        })
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      setStats(prev => ({ ...prev, todayCount, yesterdayCount, monthRevenue, lastMonthRevenue }));
    });

    // Fetch occupation: count active bookings vs total capacity
    Promise.all([
      supabase.from('tours').select('id, max_capacity, current_bookings'),
      supabase.from('bookings').select('tour_id, status').in('status', ['pending', 'confirmed']),
    ]).then(([toursRes, bookingsRes]) => {
      const toursData = toursRes.data;
      const bookingsData = bookingsRes.data;
      if (!toursData || toursData.length === 0) return;

      const totalCapacity = toursData.reduce((s, t) => s + (t.max_capacity || 1), 0);

      // Prefer counting real bookings over current_bookings field
      let totalBooked = 0;
      if (bookingsData && bookingsData.length > 0) {
        // Count bookings per tour
        const bookingCounts: Record<string, number> = {};
        bookingsData.forEach(b => {
          bookingCounts[b.tour_id] = (bookingCounts[b.tour_id] || 0) + 1;
        });
        totalBooked = Object.values(bookingCounts).reduce((s, c) => s + c, 0);
      } else {
        // Fallback to current_bookings field
        totalBooked = toursData.reduce((s, t) => s + (t.current_bookings || 0), 0);
      }

      const pct = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
      setStats(prev => ({ ...prev, occupationPct: pct }));
    });

    // Fetch season mode
    supabase.from('seasonal_config').select('mode').limit(1).single().then(({ data }) => {
      if (data?.mode) setSeasonMode(data.mode);
    });
  }, []);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = !searchQuery || b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || b.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBookings.length / perPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * perPage, currentPage * perPage);
  const showingFrom = filteredBookings.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const showingTo = Math.min(currentPage * perPage, filteredBookings.length);

  const exportReport = () => {
    const csv = [
      ['Cliente', 'Email', 'Tour', 'Monto', 'Estado', 'Fecha'].join(','),
      ...bookings.map(b => [
        b.customer_name, b.customer_email, b.tours?.title_es || '', b.total_amount, b.status,
        format(new Date(b.created_at), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-bluelake-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumen del Día</h1>
          <p className="text-sm text-muted-foreground">Bienvenido de nuevo, administrador.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewLiveSiteButton />
          <Button variant="outline" size="sm" className="gap-2" onClick={exportReport}>
            <FileDown className="w-4 h-4" />
            Exportar Reporte
          </Button>
          <Link to="/admin/bookings">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Nueva Reserva
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Reservas hoy */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground font-medium">Reservas hoy</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{stats.todayCount}</span>
            {stats.yesterdayCount > 0 ? (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${stats.todayCount >= stats.yesterdayCount ? 'text-emerald-600' : 'text-red-500'}`}>
                {stats.todayCount >= stats.yesterdayCount ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stats.yesterdayCount > 0 ? `${Math.round(((stats.todayCount - stats.yesterdayCount) / stats.yesterdayCount) * 100)}%` : 'nuevo'}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">vs ayer</span>
            )}
          </div>
        </div>

        {/* Ingresos del mes */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground font-medium">Ingresos del mes</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">S/ {stats.monthRevenue.toLocaleString()}</span>
            {stats.lastMonthRevenue > 0 ? (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${stats.monthRevenue >= stats.lastMonthRevenue ? 'text-emerald-600' : 'text-red-500'}`}>
                {stats.monthRevenue >= stats.lastMonthRevenue ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.round(((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">mes actual</span>
            )}
          </div>
        </div>

        {/* Ocupación */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground font-medium">Ocupación General</span>
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-orange" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{stats.occupationPct}%</span>
            <span className="text-xs text-muted-foreground">capacidad total</span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-accent-orange transition-all" style={{ width: `${stats.occupationPct}%` }} />
          </div>
        </div>
      </div>

      {/* Control de Estado del Río */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Control de Estado del Río (Lógica Estacional)</h3>
              <p className="text-sm text-muted-foreground">Determina qué tours y vistas se muestran en la web pública.</p>
            </div>
          </div>
          <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Actual: {seasonMode === 'auto' ? 'Automático' : seasonMode === 'vaciante' ? 'Vaciante' : 'Creciente'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'auto', label: 'Automático', desc: 'Basado en fecha del servidor' },
            { value: 'vaciante', label: 'Manual: Vaciante', desc: 'Temporada seca (Playas visibles)' },
            { value: 'creciente', label: 'Manual: Creciente', desc: 'Temporada alta (Selva inundada)' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={async () => {
                setSeasonMode(opt.value);
                await supabase.from('seasonal_config').update({ mode: opt.value }).neq('id', '');
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${seasonMode === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-foreground">{opt.label}</span>
                {seasonMode === opt.value && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom section: Últimas Reservas */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Últimas Reservas</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 w-52 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-sm">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros {statusFilter !== 'all' && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className="justify-between cursor-pointer">
                    Todos los estados
                    {statusFilter === 'all' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter('confirmed'); setCurrentPage(1); }} className="justify-between cursor-pointer">
                    Confirmados
                    {statusFilter === 'confirmed' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }} className="justify-between cursor-pointer">
                    Pendientes
                    {statusFilter === 'pending' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter('cancelled'); setCurrentPage(1); }} className="justify-between cursor-pointer">
                    Cancelados
                    {statusFilter === 'cancelled' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/30">
              <tr>
                {['CLIENTE', 'TOUR', 'FECHA', 'ESTADO'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBookings.map(b => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{b.tours?.title_es || 'Tour'}</div>
                    <div className="text-xs text-muted-foreground">{b.adults + b.children} Personas</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(b.created_at), 'dd MMM, yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-secondary text-foreground'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No hay reservas recientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando {showingFrom} a {showingTo} de {filteredBookings.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Atrás
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
