import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle2, MessageSquare } from 'lucide-react';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';

interface CorporateRequest {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  group_size: number;
  requested_dates: string;
  notes: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary/10 text-primary',
  contacted: 'bg-accent-orange/10 text-accent-orange',
  quoted: 'bg-jungle/10 text-jungle',
  closed: 'bg-secondary text-secondary-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'En contacto',
  quoted: 'Cotizado',
  closed: 'Cerrado',
};

const AdminCorporate: React.FC = () => {
  const [requests, setRequests] = useState<CorporateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CorporateRequest | null>(null);

  const fetch = () => {
    setLoading(true);
    supabase.from('corporate_requests').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setRequests(data || []); setLoading(false); });
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('corporate_requests').update({ status }).eq('id', id);
    fetch();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> Solicitudes Corporativas
        </h1>
        <ViewLiveSiteButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground">No hay solicitudes</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelected(req)}
                className={`bg-card rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md ${selected?.id === req.id ? 'border-primary' : 'border-border'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-foreground">{req.company_name}</div>
                    <div className="text-sm text-muted-foreground">{req.contact_person}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{req.email} · Grupo: {req.group_size || '—'}</div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 h-fit">
            <h2 className="font-bold text-foreground text-lg">{selected.company_name}</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Contacto', selected.contact_person],
                ['Email', selected.email],
                ['Teléfono', selected.phone || '—'],
                ['Grupo', selected.group_size ? `${selected.group_size} personas` : '—'],
                ['Fechas', selected.requested_dates || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notas
                </div>
                <p className="text-sm text-foreground">{selected.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(selected.id, key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selected.status === key ? STATUS_COLORS[key] : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCorporate;
