import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

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
  pending: 'bg-accent-orange/10 text-accent-orange',
  confirmed: 'bg-jungle/10 text-jungle',
  cancelled: 'bg-destructive/10 text-destructive',
};

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBookings = () => {
    setLoading(true);
    let query = supabase.from('bookings').select('*, tours(title_es)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    query.then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    fetchBookings();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {['all', 'pending', 'confirmed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendientes' : s === 'confirmed' ? 'Confirmadas' : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando reservas...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay reservas</div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  {['Cliente', 'Contacto', 'Experiencia', 'Fechas', 'Resumen', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{b.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{b.document_type || 'Doc'}: {b.document_number || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Telf: {b.customer_phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {b.tours?.title_es || 'Tour'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-pre-wrap max-w-[150px]">
                      {b.dates?.join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-primary">${b.total_amount}</div>
                      <div className="text-xs text-muted-foreground">{b.adults}A {b.children}N</div>
                      <div className="text-xs text-muted-foreground">{b.payment_method} / {b.payment_mode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-secondary text-foreground'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(b.id, 'confirmed')} className="p-1.5 rounded-lg bg-jungle/10 hover:bg-jungle/20 text-jungle transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
