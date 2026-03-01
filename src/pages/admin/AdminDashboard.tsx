import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, today: 0 });

  useEffect(() => {
    supabase.from('bookings').select('status, created_at').then(({ data }) => {
      if (!data) return;
      const today = new Date().toDateString();
      setStats({
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        today: data.filter(b => new Date(b.created_at).toDateString() === today).length,
      });
    });
  }, []);

  const cards = [
    { label: 'Reservas Totales', value: stats.total, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: 'text-jungle', bg: 'bg-jungle/10' },
    { label: 'Hoy', value: stats.today, icon: Calendar, color: 'text-foreground', bg: 'bg-secondary' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-2">Panel Bluelake</h2>
        <p className="text-muted-foreground text-sm">Gestiona tours, reservas, temporadas y solicitudes corporativas desde el menú lateral.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
