import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Loader2, Upload, Image as ImageIcon, Search, Copy, Settings2, Save, Clock, Users, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';

interface Tour {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  category: string;
  season: string;
  base_price: number;
  max_capacity: number;
  premium: boolean;
  visible: boolean;
  current_bookings: number;
  image_url: string;
  images: string[];
  is_season_featured: boolean;
  video_url: string;
  duration?: string;
  included_items?: string[];
  itinerary?: {time: string, activity: string}[];
}

const defaultTour: Partial<Tour> = {
  title_es: '',
  title_en: '',
  description_es: '',
  description_en: '',
  slug: '',
  category: 'naturaleza',
  season: 'all',
  base_price: 0,
  max_capacity: 10,
  premium: false,
  visible: true,
  current_bookings: 0,
  image_url: '',
  images: [],
  is_season_featured: false,
  video_url: '',
  duration: '',
  included_items: [],
  itinerary: [],
};

const AdminTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [isNewTour, setIsNewTour] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Estados Categorías
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ old: string, new: string } | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Referencias para disparar los inputs de archivo de manera robusta
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Recuperar borrador si el usuario recargó accidentalmente la página
  useEffect(() => {
    const savedDraft = sessionStorage.getItem('adminTourDraft');
    const savedIsNew = sessionStorage.getItem('adminTourIsNew');
    if (savedDraft && savedIsNew !== null) {
      setEditingTour(JSON.parse(savedDraft));
      setIsNewTour(JSON.parse(savedIsNew));
    }
  }, []);

  // Guardar el borrador en todo momento para evitar perder información en refresh
  useEffect(() => {
    if (editingTour) {
      sessionStorage.setItem('adminTourDraft', JSON.stringify(editingTour));
      sessionStorage.setItem('adminTourIsNew', JSON.stringify(isNewTour));
    } else {
      sessionStorage.removeItem('adminTourDraft');
      sessionStorage.removeItem('adminTourIsNew');
    }
  }, [editingTour, isNewTour]);

  const fetchTours = () => {
    supabase.from('tours').select('id,slug,title_es,title_en,description_es,description_en,category,season,base_price,max_capacity,premium,visible,current_bookings,image_url,images,is_season_featured,video_url,duration,included_items,itinerary')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTours(data || []); setLoading(false); });
  };

  useEffect(() => { fetchTours(); }, []);

  const toggleVisible = async (id: string, visible: boolean) => {
    await supabase.from('tours').update({ visible: !visible }).eq('id', id);
    fetchTours();
  };

  const confirmDelete = async () => {
    if (!tourToDelete) return;
    const { error } = await supabase.from('tours').delete().eq('id', tourToDelete);
    if (error) {
      toast.error('No se pudo eliminar el tour. Asegúrate de que no tenga reservas asociadas.\n' + error.message);
    } else {
      toast.success('Tour eliminado permanentemente.');
      fetchTours();
    }
    setTourToDelete(null);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.new.trim()) return;
    if (editingCategory.old === editingCategory.new.trim()) {
      setEditingCategory(null);
      return;
    }

    setIsSavingCategory(true);
    const newCategorySlug = editingCategory.new.trim().toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase
      .from('tours')
      .update({ category: newCategorySlug })
      .eq('category', editingCategory.old);

    if (error) {
      toast.error('Error actualizando la categoría: ' + error.message);
    } else {
      toast.success('Categoría actualizada exitosamente');
      setEditingCategory(null);
      fetchTours();
    }
    setIsSavingCategory(false);
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${catToDelete}"? Los tours que pertenezcan a ella quedarán como "otros".`)) return;

    setIsSavingCategory(true);
    const { error } = await supabase
      .from('tours')
      .update({ category: 'otros' })
      .eq('category', catToDelete);

    if (error) {
      toast.error('Error eliminando la categoría: ' + error.message);
    } else {
      toast.success('Categoría eliminada');
      if (activeCategory === catToDelete) setActiveCategory('todos');
      fetchTours();
    }
    setIsSavingCategory(false);
  };

  const handleEdit = (tour: Tour) => {
    setIsNewTour(false);
    setEditingTour(tour);
    setIsAddingNewCategory(false);
  };

  const handleNew = () => {
    setIsNewTour(true);
    setEditingTour(defaultTour);
    setIsAddingNewCategory(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      toast.info('Subiendo imagen...');

      const { error: uploadError } = await supabase.storage
        .from('tour-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tour-images')
        .getPublicUrl(filePath);

      setEditingTour(prev => prev ? { ...prev, image_url: publicUrl } : null);
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error('Error subiendo imagen: ' + error.message);
    } finally {
      e.target.value = ''; // Reset to allow re-upload of same file
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      if (!editingTour) return;

      const currentImages = editingTour.images || [];
      const remainingSlots = 5 - currentImages.length;

      if (remainingSlots <= 0) {
        toast.error('Has alcanzado el límite máximo de 5 imágenes.');
        e.target.value = '';
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      toast.info(`Iniciando subida de ${filesToUpload.length} imagen(es)...`);

      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tour-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('tour-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setEditingTour(prev => prev ? { ...prev, images: [...(prev.images || []), ...uploadedUrls] } : null);
      toast.success(`${uploadedUrls.length} imagen(es) añadida(s) a la galería`);
    } catch (error: any) {
      toast.error('Error subiendo galería: ' + error.message);
    } finally {
      e.target.value = ''; // Reset value
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('El video es demasiado pesado. El límite es 50MB.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `video_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      toast.info('Subiendo video, esto puede tardar un momento...');

      // Usaremos el mismo bucket 'tour-images' ya que funciona como un bucket público general en Supabase si no está restringido por MIME type.
      const { error: uploadError } = await supabase.storage
        .from('tour-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tour-images')
        .getPublicUrl(filePath);

      setEditingTour(prev => prev ? { ...prev, video_url: publicUrl } : null);
      toast.success('Video subido correctamente');
    } catch (error: any) {
      toast.error('Error subiendo video: ' + error.message);
    } finally {
      e.target.value = ''; // Reset to allow re-upload of same file
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setEditingTour(prev => {
      if (!prev || !prev.images) return prev;
      const newImages = [...prev.images];
      newImages.splice(indexToRemove, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleAddIncludedItem = () => {
    setEditingTour(prev => {
      if (!prev) return prev;
      return { ...prev, included_items: [...(prev.included_items || []), ''] };
    });
  };

  const updateIncludedItem = (index: number, value: string) => {
    setEditingTour(prev => {
      if (!prev || !prev.included_items) return prev;
      const newItems = [...prev.included_items];
      newItems[index] = value;
      return { ...prev, included_items: newItems };
    });
  };

  const removeIncludedItem = (index: number) => {
    setEditingTour(prev => {
      if (!prev || !prev.included_items) return prev;
      const newItems = [...prev.included_items];
      newItems.splice(index, 1);
      return { ...prev, included_items: newItems };
    });
  };

  const handleAddItineraryStep = () => {
    setEditingTour(prev => {
      if (!prev) return prev;
      return { ...prev, itinerary: [...(prev.itinerary || []), { time: '', activity: '' }] };
    });
  };

  const updateItineraryStep = (index: number, field: 'time' | 'activity', value: string) => {
    setEditingTour(prev => {
      if (!prev || !prev.itinerary) return prev;
      const newItinerary = [...prev.itinerary];
      newItinerary[index] = { ...newItinerary[index], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const removeItineraryStep = (index: number) => {
    setEditingTour(prev => {
      if (!prev || !prev.itinerary) return prev;
      const newItinerary = [...prev.itinerary];
      newItinerary.splice(index, 1);
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour) return;
    setIsSaving(true);
    let error;

    if (isNewTour) {
      const result = await supabase.from('tours').insert({
        title_es: editingTour.title_es,
        title_en: editingTour.title_en,
        description_es: editingTour.description_es,
        description_en: editingTour.description_en,
        slug: editingTour.slug,
        category: editingTour.category,
        season: editingTour.season,
        base_price: editingTour.base_price,
        max_capacity: editingTour.max_capacity,
        premium: editingTour.premium || false,
        visible: editingTour.visible ?? true,
        image_url: editingTour.image_url,
        images: editingTour.images || [],
        is_season_featured: editingTour.is_season_featured || false,
        video_url: editingTour.video_url || '',
        duration: editingTour.duration || '',
        included_items: editingTour.included_items || [],
        itinerary: editingTour.itinerary || [],
      });
      error = result.error;
    } else {
      const result = await supabase.from('tours').update({
        title_es: editingTour.title_es,
        title_en: editingTour.title_en,
        description_es: editingTour.description_es,
        description_en: editingTour.description_en,
        slug: editingTour.slug,
        category: editingTour.category,
        season: editingTour.season,
        base_price: editingTour.base_price,
        max_capacity: editingTour.max_capacity,
        premium: editingTour.premium,
        image_url: editingTour.image_url,
        images: editingTour.images || [],
        is_season_featured: editingTour.is_season_featured,
        video_url: editingTour.video_url,
        duration: editingTour.duration,
        included_items: editingTour.included_items,
        itinerary: editingTour.itinerary,
      }).eq('id', editingTour.id);
      error = result.error;
    }

    if (error) {
      alert(`Error ${isNewTour ? 'creando' : 'guardando'} el tour:\n` + error.message);
      console.error(error);
    } else {
      setEditingTour(null);
      setIsNewTour(false);
      fetchTours();
    }
    setIsSaving(false);
  };

  const dbCategories = Array.from(new Set(tours.map(t => t.category).filter(Boolean)));
  const filterCategories = ['todos', ...dbCategories];

  const filtered = tours.filter(t => {
    const searchMatch = t.title_es.toLowerCase().includes(search.toLowerCase()) ||
      t.title_en.toLowerCase().includes(search.toLowerCase());
    const catMatch = activeCategory === 'todos' || t.category === activeCategory;
    return searchMatch && catMatch;
  });

  const publishedCount = tours.filter(t => t.visible).length;
  const hiddenCount = tours.filter(t => !t.visible).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Catálogo de Tours</h1>
          <p className="text-muted-foreground text-sm">Gestiona, edita y publica tus experiencias turísticas.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ViewLiveSiteButton />
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </span>
            <Input
              placeholder="Buscar tour..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background h-10 w-full"
            />
          </div>
          <button onClick={handleNew} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors text-sm whitespace-nowrap shadow-sm">
            <Plus className="w-5 h-5" /> Nuevo Tour
          </button>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            {filterCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary'
                  }`}
              >
                {cat === 'todos' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
              </button>
            ))}

            {/* Botón Gestión de Categorías (Alternativa 2) */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="ml-1 flex-shrink-0 size-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
              title="Gestionar Categorías"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm whitespace-nowrap hidden sm:flex">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-400 font-medium">{publishedCount} Publicados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-slate-600 dark:text-slate-400 font-medium">{hiddenCount} Ocultos</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(tour => (
            <div key={tour.id} className="group bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col">
              {/* Image Header */}
              <div className="relative h-56 overflow-hidden shrink-0">
                {tour.image_url ? (
                  <img src={tour.image_url} alt={tour.title_es} className={`w-full h-full object-cover transition-transform duration-700 ${!tour.visible ? 'grayscale opacity-80 group-hover:scale-105' : 'group-hover:scale-105'}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-800"><ImageIcon className="w-10 h-10 opacity-20" /></div>
                )}

                {/* Categoría Estilo Premium Glass */}
                {tour.category && (
                  <div className="absolute top-4 left-4 bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {tour.category.charAt(0).toUpperCase() + tour.category.slice(1).replace(/-/g, ' ')}
                  </div>
                )}
              </div>

              {/* Content body */}
              <div className="p-6 flex flex-col grow">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[1.1rem] leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">{tour.title_es}</h3>
                <p className="text-primary font-bold text-[1.35rem] mb-4">
                  S/ {tour.base_price} <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">PEN</span>
                </p>

                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm mb-6">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Flexible
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {tour.max_capacity}+
                  </span>
                </div>

                <div className="flex items-center justify-between pt-5 mt-auto border-t border-slate-100 dark:border-slate-800/60">
                  <div title={tour.visible ? "Ocultar tour del catálogo" : "Hacer visible en el catálogo"} className="flex flex-col cursor-help">
                    <Switch checked={tour.visible} onCheckedChange={() => toggleVisible(tour.id, tour.visible)}
                      className="data-[state=checked]:bg-primary shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setTourToDelete(tour.id)} className="p-2.5 text-slate-300 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors" title="Eliminar">
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                    <button onClick={() => handleEdit(tour)} className="px-5 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-semibold transition-colors shadow-sm tracking-wide">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Special Create Tour Card */}
          <button onClick={handleNew} className="bg-transparent rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-card/30 transition-all aspect-[4/4] min-h-[360px] cursor-pointer">
            <div className="w-14 h-14 rounded-full border border-current flex items-center justify-center bg-card shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-base">Crear nuevo tour</p>
              <p className="text-sm text-muted-foreground mt-1">Comienza desde cero</p>
            </div>
          </button>
        </div>
      )}

      {editingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingTour(null)}>
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">{isNewTour ? 'Crear Nuevo Tour' : 'Editar Tour'}</h2>
              <button type="button" onClick={() => setEditingTour(null)} className="p-2 hover:bg-secondary rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-semibold mb-1 block">Título (Español)</label>
                <Input value={editingTour.title_es} onChange={e => setEditingTour({ ...editingTour, title_es: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Título (Inglés)</label>
                <Input value={editingTour.title_en || ''} onChange={e => setEditingTour({ ...editingTour, title_en: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Reseña / Descripción Corta (Español)</label>
                <Textarea value={editingTour.description_es || ''} onChange={e => setEditingTour({ ...editingTour, description_es: e.target.value })} placeholder="Ingresar descripción atractiva del tour..." rows={3} required />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Reseña / Descripción Corta (Inglés)</label>
                <Textarea value={editingTour.description_en || ''} onChange={e => setEditingTour({ ...editingTour, description_en: e.target.value })} placeholder="Enter an engaging description..." rows={3} required />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Slug (URL)</label>
                <Input value={editingTour.slug} onChange={e => setEditingTour({ ...editingTour, slug: e.target.value })} required />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Imagen de Portada del Tour</label>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {editingTour.image_url ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-border">
                          <img src={editingTour.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-dashed border-border text-muted-foreground">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input type="url" placeholder="URL o subir archivo..." value={editingTour.image_url || ''} onChange={e => setEditingTour({ ...editingTour, image_url: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 h-10 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-md transition-colors cursor-pointer border border-border shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    Subir foto
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Sube una imagen o pega directamente un link. Recomendado: 1200x800 px.</p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold block">Galería de Imágenes (Máx 5)</label>
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={(editingTour.images?.length || 0) >= 5}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all border border-border ${(editingTour.images?.length || 0) >= 5 ? 'bg-secondary/50 text-muted-foreground opacity-50 cursor-not-allowed' : 'bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer active:scale-95'}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Añadir Imágenes
                  </button>
                </div>

                {(!editingTour.images || editingTour.images.length === 0) ? (
                  <div className="p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground bg-secondary/20">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay imágenes en la galería.</p>
                    <p className="text-xs mt-1">Sube hasta 5 fotos para complementar la experiencia del tour.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {editingTour.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden group border border-border">
                        <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="bg-destructive text-destructive-foreground p-1.5 rounded-full hover:scale-110 transition-transform shadow-lg"
                            title="Eliminar de galería"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {(editingTour.images?.length || 0)} de 5 imágenes utilizadas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Categoría</label>
                  {isAddingNewCategory ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingTour.category}
                        onChange={e => setEditingTour({ ...editingTour, category: e.target.value })}
                        placeholder="Nombre de nueva categoría..."
                        className="flex-1"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setEditingTour({ ...editingTour, category: dbCategories[0] || 'naturaleza' });
                        }}
                        className="p-2 border border-border rounded-md hover:bg-secondary text-muted-foreground transition-colors shrink-0"
                        title="Cancelar y volver a seleccionar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingTour.category}
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW_CATEGORY_OPTION') {
                          setIsAddingNewCategory(true);
                          setEditingTour({ ...editingTour, category: '' });
                        } else {
                          setEditingTour({ ...editingTour, category: e.target.value });
                        }
                      }}
                      required
                    >
                      {Array.from(new Set(['naturaleza', 'aventura', 'cultura', 'actividades-acuaticas', 'premium', ...dbCategories])).map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                        </option>
                      ))}
                      <option value="ADD_NEW_CATEGORY_OPTION" className="font-bold text-primary">
                        + Añadir nueva categoría
                      </option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Temporada</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingTour.season} onChange={e => setEditingTour({ ...editingTour, season: e.target.value })}
                  >
                    <option value="all">Todo el año</option>
                    <option value="winter">Invierno</option>
                    <option value="summer">Verano</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Precio Base (S/)</label>
                  <Input type="number" min="0" step="0.01" value={editingTour.base_price} onChange={e => setEditingTour({ ...editingTour, base_price: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Capacidad Máxima</label>
                  <Input type="number" min="1" value={editingTour.max_capacity} onChange={e => setEditingTour({ ...editingTour, max_capacity: parseInt(e.target.value) })} required />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="premium-tour"
                  checked={editingTour.premium || false}
                  onChange={e => setEditingTour({ ...editingTour, premium: e.target.checked })}
                  className="w-4 h-4 text-accent-orange rounded border-border"
                />
                <label htmlFor="premium-tour" className="text-sm font-medium flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-accent-orange text-accent-orange" /> Destacar como experiencia Premium</label>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Detalles Adicionales y Duración</h3>
                <div className="mb-4">
                  <label className="text-sm font-semibold mb-1 block">Duración del Tour (Ej: 4 a 5 hrs)</label>
                  <Input 
                    value={editingTour.duration || ''} 
                    onChange={e => setEditingTour({...editingTour, duration: e.target.value})}
                    placeholder="2 a 3 horas" 
                  />
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-semibold mb-1 block flex justify-between items-center">
                    Lo que Incluye
                    <button type="button" onClick={handleAddIncludedItem} className="text-xs text-primary font-bold hover:underline">
                      + Añadir Item
                    </button>
                  </label>
                  {(editingTour.included_items || []).map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                       <Input 
                          value={item}
                          onChange={e => updateIncludedItem(index, e.target.value)}
                          placeholder="Ej: Recojo y traslado, Guía turístico"
                          className="flex-1 text-sm"
                       />
                       <button type="button" onClick={() => removeIncludedItem(index)} className="p-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
                </div>

                <div>
                   <label className="text-sm font-semibold mb-1 block flex justify-between items-center">
                    Línea de Tiempo del Itinerario
                    <button type="button" onClick={handleAddItineraryStep} className="text-xs text-primary font-bold hover:underline">
                      + Añadir Parada
                    </button>
                  </label>
                  {(editingTour.itinerary || []).map((step, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                       <Input 
                          value={step.time}
                          onChange={e => updateItineraryStep(index, 'time', e.target.value)}
                          placeholder="09:00 AM"
                          className="w-1/3 text-sm"
                       />
                       <Textarea 
                          rows={2}
                          value={step.activity}
                          onChange={e => updateItineraryStep(index, 'activity', e.target.value)}
                          placeholder="Visita al centro de rescate"
                          className="flex-1 text-sm min-h-[40px]"
                       />
                       <button type="button" onClick={() => removeItineraryStep(index)} className="p-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors h-10 shrink-0">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Configuración Cinematográfica</h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="season-featured-tour"
                    checked={editingTour.is_season_featured || false}
                    onChange={e => setEditingTour({ ...editingTour, is_season_featured: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-border"
                  />
                  <label htmlFor="season-featured-tour" className="text-sm font-medium flex items-center gap-1.5">
                    Destacar como Experiencia Principal de Temporada
                  </label>
                </div>
                {editingTour.is_season_featured && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Video de Fondo (Subir MP4 o enlazar YouTube)</label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="url"
                        placeholder="https://ejemplo.com/video.mp4 o YouTube"
                        value={editingTour.video_url || ''}
                        onChange={e => setEditingTour({ ...editingTour, video_url: e.target.value })}
                        className="flex-1"
                      />
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-4 h-10 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-md transition-colors cursor-pointer border border-border shrink-0"
                      >
                        <Upload className="w-4 h-4" />
                        Subir MP4
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Sube un video corto (límite 50MB) o pega una URL de YouTube. Este video se reproducirá en pantalla completa silenciado al seleccionar la temporada.
                      <br className="hidden sm:block" />
                      <span className="font-medium text-primary mt-1 inline-block">Dimensiones sugeridas: 1920x1080 píxeles (formato horizontal 16:9)</span> para una visualización óptima en calidad cinematográfica.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-border">
                <button type="button" onClick={() => setEditingTour(null)} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2 hover:bg-primary/90 transition">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isNewTour ? 'Crear Tour' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Gestionar Categorías</h2>
                <p className="text-xs text-muted-foreground mt-1">Renombra o elimina las categorías asignadas a los tours.</p>
              </div>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {dbCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay categorías registradas.</p>
              ) : (
                <div className="space-y-3">
                  {dbCategories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-secondary/50 transition-colors">
                      {editingCategory?.old === cat ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={editingCategory.new}
                            onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <button
                            disabled={isSavingCategory}
                            onClick={handleUpdateCategory}
                            className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                          >
                            {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1.5 bg-secondary text-foreground rounded-md hover:bg-secondary/80 border border-border"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-sm text-foreground">
                            {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingCategory({ old: cat, new: cat })}
                              className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              title="Editar nombre"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  ¿Cómo agrego una nueva categoría?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Las categorías se crean automáticamente al seleccionar la opción <strong>"+ Añadir nueva categoría"</strong> en el desplegable de Categoría al crear o editar un tour.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!tourToDelete} onOpenChange={(open) => !open && setTourToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este tour?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de la base de datos.
              Esta acción fallará si el tour tiene reservas asociadas por integridad de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTours;
