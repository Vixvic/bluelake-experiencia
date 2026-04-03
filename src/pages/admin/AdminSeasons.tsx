import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Snowflake, Sun, Settings, Zap } from 'lucide-react';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';
import { siteContentService, SiteContent } from '@/services/siteContentService';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface SeasonConfig {
  id: string;
  mode: string;
  current_season: string;
  override_active: boolean;
}

const AdminSeasons: React.FC = () => {
  const [config, setConfig] = useState<SeasonConfig | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  // Selector state
  const [tours, setTours] = useState<{ id: string, title_es: string, season: string, is_season_featured: boolean }[]>([]);
  const [featuredWinterTour, setFeaturedWinterTour] = useState<string>('');
  const [featuredSummerTour, setFeaturedSummerTour] = useState<string>('');
  const [savingFeatured, setSavingFeatured] = useState(false);

  const autoSeason = (() => {
    const m = new Date().getMonth() + 1;
    return m >= 7 && m <= 11 ? 'summer' : 'winter';
  })();

  const loadTours = async () => {
    const { data } = await supabase.from('tours').select('id, title_es, season, is_season_featured');
    if (data) {
      setTours(data);
      const winterTour = data.find(t => t.season === 'winter' && t.is_season_featured)?.id || '';
      const summerTour = data.find(t => t.season === 'summer' && t.is_season_featured)?.id || '';
      setFeaturedWinterTour(winterTour);
      setFeaturedSummerTour(summerTour);
    }
  };

  useEffect(() => {
    supabase.from('seasonal_config').select('*').single().then(({ data }) => setConfig(data));
    siteContentService.getContent().then(data => setSiteContent(data));
    loadTours();
  }, []);

  const save = async (updates: Partial<SeasonConfig>) => {
    if (!config) return;
    setSaving(true);
    const { data, error } = await supabase.from('seasonal_config').update(updates).eq('id', config.id).select().single();
    if (data) {
      setConfig(data);
      toast.success('Regla estacional guardada');
    }
    if (error) toast.error('Error al guardar lógica');
    setSaving(false);
  };

  const saveFeaturedTours = async () => {
    setSavingFeatured(true);
    try {
      // 1. Limpiar todos los featured tours de ambas temporadas
      await supabase.from('tours').update({ is_season_featured: false }).in('season', ['winter', 'summer']).eq('is_season_featured', true);
      
      // 2. Establecer los nuevos (y cambiarles el season asegurando que coincida numéricamente)
      if (featuredWinterTour) {
        await supabase.from('tours').update({ is_season_featured: true, season: 'winter' }).eq('id', featuredWinterTour);
      }
      if (featuredSummerTour) {
        await supabase.from('tours').update({ is_season_featured: true, season: 'summer' }).eq('id', featuredSummerTour);
      }
      
      toast.success('Tours Estrella guardados con éxito');
      loadTours(); // recargar
    } catch (err: any) {
      toast.error('Error al guardar tours: ' + err.message);
    } finally {
      setSavingFeatured(false);
    }
  };

  const saveContent = async () => {
    if (!siteContent) return;
    setSavingContent(true);
    try {
      await siteContentService.updateContent(siteContent);
      toast.success('Textos del Motor Estacional guardados');
    } catch (error: any) {
      toast.error('Error al guardar textos: ' + error.message);
    } finally {
      setSavingContent(false);
    }
  };

  if (!config || !siteContent) return <div className="p-8 text-muted-foreground flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const activeSeason = config.mode === 'auto' ? autoSeason : config.current_season;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Temporadas</h1>
        <ViewLiveSiteButton />
      </div>

      {/* Current status */}
      <div className={`rounded-2xl p-6 mb-6 flex items-center gap-4 ${activeSeason === 'summer' ? 'bg-accent-orange/10 border border-accent-orange/30' : 'bg-primary/10 border border-primary/30'}`}>
        {activeSeason === 'summer' ? <Sun className="w-8 h-8 text-accent-orange" /> : <Snowflake className="w-8 h-8 text-primary" />}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-0.5">Temporada activa ahora</div>
          <div className="text-xl font-bold text-foreground">
            {activeSeason === 'summer' ? 'Verano Amazónico (Jul–Nov)' : 'Invierno Amazónico (Dic–Jun)'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Modo: {config.mode === 'auto' ? 'Automático por fecha del sistema' : 'Manual (forzado por admin)'}
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-5">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> Modo de Control
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['auto', 'manual'].map((mode) => (
            <button
              key={mode}
              onClick={() => save({ mode, current_season: mode === 'auto' ? autoSeason : config.current_season })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${config.mode === mode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            >
              <div className="font-semibold text-foreground text-sm mb-1">
                {mode === 'auto' ? '🤖 Automático' : '✍️ Manual'}
              </div>
              <div className="text-xs text-muted-foreground">
                {mode === 'auto' ? 'La temporada se detecta por la fecha del sistema' : 'El admin elige la temporada activa'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual season override */}
      {config.mode === 'manual' && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-orange" /> Forzar Temporada
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'winter', label: 'Invierno Amazónico', icon: Snowflake, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary' },
              { key: 'summer', label: 'Verano Amazónico', icon: Sun, color: 'text-accent-orange', bg: 'bg-accent-orange/5', border: 'border-accent-orange' },
            ].map(({ key, label, icon: Icon, color, bg, border }) => (
              <button
                key={key}
                onClick={() => save({ current_season: key, override_active: true })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${config.current_season === key ? `${border} ${bg}` : 'border-border hover:border-primary/30'}`}
              >
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <div className="font-semibold text-foreground text-sm">{label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selección de Tours Destacados */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Tours Destacados (Cinematic Engine)</h2>
            <p className="text-xs text-muted-foreground mt-1">Elige qué tour se mostrará en pantalla principal durante cada temporada.</p>
          </div>
          <button
            onClick={saveFeaturedTours}
            disabled={savingFeatured}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {savingFeatured ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Tours
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-accent-orange" /> Verano Amazónico</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={featuredSummerTour}
                onChange={e => setFeaturedSummerTour(e.target.value)}
              >
                <option value="">-- Seleccionar Tour Destacado --</option>
                {tours.map(t => (
                  <option key={t.id} value={t.id}>{t.title_es}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
               <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Snowflake className="w-3.5 h-3.5 text-primary" /> Invierno Amazónico</label>
               <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={featuredWinterTour}
                onChange={e => setFeaturedWinterTour(e.target.value)}
              >
                <option value="">-- Seleccionar Tour Destacado --</option>
                {tours.map(t => (
                  <option key={t.id} value={t.id}>{t.title_es}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Editor de Contenido Web del Motor Estacional */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-2">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Textos Principales del Módulo</h2>
            <p className="text-xs text-muted-foreground mt-1">Configura el título y la descripción del Motor Estacional. Puedes usar "Enter" para saltos de línea.</p>
          </div>
          <button
            onClick={saveContent}
            disabled={savingContent}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {savingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 block">Título (ES)</label>
              <Textarea
                rows={2}
                value={siteContent?.seasonsConfig?.title_es || ''}
                onChange={e => setSiteContent(prev => prev ? {
                  ...prev,
                  seasonsConfig: { ...prev.seasonsConfig!, title_es: e.target.value }
                } : null)}
                className="bg-muted/30 border-border resize-none font-medium text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 block">Subtítulo (ES)</label>
              <Textarea
                rows={4}
                value={siteContent?.seasonsConfig?.subtitle_es || ''}
                onChange={e => setSiteContent(prev => prev ? {
                  ...prev,
                  seasonsConfig: { ...prev.seasonsConfig!, subtitle_es: e.target.value }
                } : null)}
                className="bg-muted/30 border-border resize-none text-muted-foreground"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 block">Título (EN)</label>
              <Textarea
                rows={2}
                value={siteContent?.seasonsConfig?.title_en || ''}
                onChange={e => setSiteContent(prev => prev ? {
                  ...prev,
                  seasonsConfig: { ...prev.seasonsConfig!, title_en: e.target.value }
                } : null)}
                className="bg-muted/30 border-border resize-none font-medium text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground mb-1.5 block">Subtítulo (EN)</label>
              <Textarea
                rows={4}
                value={siteContent?.seasonsConfig?.subtitle_en || ''}
                onChange={e => setSiteContent(prev => prev ? {
                  ...prev,
                  seasonsConfig: { ...prev.seasonsConfig!, subtitle_en: e.target.value }
                } : null)}
                className="bg-muted/30 border-border resize-none text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>


      {saving && <p className="text-xs text-muted-foreground mt-3">Guardando...</p>}
    </div>
  );
};

export default AdminSeasons;
