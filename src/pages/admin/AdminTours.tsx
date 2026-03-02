import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
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
};

const AdminTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [isNewTour, setIsNewTour] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  // Referencias para disparar los inputs de archivo de manera robusta
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    supabase.from('tours').select('id,slug,title_es,title_en,description_es,description_en,category,season,base_price,max_capacity,premium,visible,current_bookings,image_url,images')
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

  const handleEdit = (tour: Tour) => {
    setIsNewTour(false);
    setEditingTour(tour);
  };

  const handleNew = () => {
    setIsNewTour(true);
    setEditingTour(defaultTour);
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

  const removeGalleryImage = (indexToRemove: number) => {
    setEditingTour(prev => {
      if (!prev || !prev.images) return prev;
      const newImages = [...prev.images];
      newImages.splice(indexToRemove, 1);
      return { ...prev, images: newImages };
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

  const filtered = tours.filter(t =>
    t.title_es.toLowerCase().includes(search.toLowerCase()) ||
    t.title_en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Tours</h1>
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> Nuevo tour
        </button>
      </div>

      <Input
        placeholder="Buscar tours..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-5 max-w-xs"
      />

      {loading ? (
        <p className="text-muted-foreground">Cargando tours...</p>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                {['Tour', 'Categoría', 'Temporada', 'Precio', 'Capacidad', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((tour) => (
                <tr key={tour.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tour.premium && <Star className="w-3.5 h-3.5 text-accent-orange fill-accent-orange" />}
                      <div>
                        <div className="font-medium text-foreground">{tour.title_es}</div>
                        <div className="text-xs text-muted-foreground">{tour.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tour.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tour.season === 'summer' ? 'bg-accent-orange/10 text-accent-orange' :
                      tour.season === 'winter' ? 'bg-primary/10 text-primary' :
                        'bg-jungle/10 text-jungle'
                      }`}>{tour.season}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">S/ {tour.base_price}</td>
                  <td className="px-4 py-3 text-foreground">{tour.current_bookings}/{tour.max_capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tour.visible ? 'bg-jungle/10 text-jungle' : 'bg-secondary text-muted-foreground'}`}>
                      {tour.visible ? 'Visible' : 'Oculto'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleVisible(tour.id, tour.visible)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={tour.visible ? 'Ocultar' : 'Mostrar'}>
                        {tour.visible ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-jungle" />}
                      </button>
                      <button onClick={() => handleEdit(tour)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Editar">
                        <Pencil className="w-4 h-4 text-primary" />
                      </button>
                      <button onClick={() => setTourToDelete(tour.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingTour.category} onChange={e => setEditingTour({ ...editingTour, category: e.target.value })}
                  >
                    <option value="naturaleza">Naturaleza</option>
                    <option value="aventura">Aventura</option>
                    <option value="cultura">Cultura</option>
                    <option value="deportes-acuaticos">Deportes Acuáticos</option>
                    <option value="premium">Premium</option>
                  </select>
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
