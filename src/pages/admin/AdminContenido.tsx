import React, { useState, useEffect, useRef } from 'react';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';
import { Save, Loader2, Upload, Trash2, Smartphone, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { siteContentService, SiteContent, HeroSlide } from '@/services/siteContentService';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminContenido: React.FC = () => {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const heroInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        siteContentService.getContent().then(data => {
            setContent(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (!content) return;
        setIsSaving(true);
        try {
            await siteContentService.updateContent(content);
            toast.success('Cambios guardados correctamente');
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !content) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `settings/${fileName}`;

            toast.loading('Subiendo archivo multimedia...', { id: 'upload' });

            const { error: uploadError } = await supabase.storage
                .from('tour-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tour-images')
                .getPublicUrl(filePath);

            const newSlides = [...content.heroSlides];
            const slideTemplate = {
                id: Date.now().toString(),
                image_url: '',
                video_url: '',
                title_es: '',
                title_en: '',
                subtitle_es: '',
                subtitle_en: '',
                order: 0
            };

            if (newSlides.length === 0) {
                newSlides.push(slideTemplate);
            }

            if (fileExt?.toLowerCase() === 'mp4') {
                newSlides[0].video_url = publicUrl;
                // Opcional: limpiar la imagen si sube video
                // newSlides[0].image_url = ''; 
            } else {
                newSlides[0].image_url = publicUrl;
                // Opcional: limpiar video si sube imagen
                // newSlides[0].video_url = ''; 
            }

            setContent({ ...content, heroSlides: newSlides });
            toast.success('Archivo subido con éxito', { id: 'upload' });
        } catch (error: any) {
            toast.error('Error subiendo archivo: ' + error.message, { id: 'upload' });
        } finally {
            if (heroInputRef.current) heroInputRef.current.value = '';
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!content) return null;

    const mainSlide: Partial<HeroSlide> = content.heroSlides[0] || {
        title_es: '',
        image_url: '',
        video_url: '',
        subtitle_es: ''
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Contenido Web</h1>
                    <p className="text-sm text-slate-500 mt-1">Administra el contenido público de la página de inicio y el blog de Bluelake.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ViewLiveSiteButton />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#0055ff] hover:bg-[#0044cc] text-white font-medium rounded-lg transition-all shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <Tabs defaultValue="inicio" className="w-full">
                <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 mb-8 space-x-8">
                    <TabsTrigger value="inicio" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0055ff] data-[state=active]:text-[#0055ff] data-[state=active]:shadow-none rounded-none px-1 py-3 text-slate-600 font-medium">
                        Página de Inicio
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0055ff] data-[state=active]:text-[#0055ff] data-[state=active]:shadow-none rounded-none px-1 py-3 text-slate-600 font-medium">
                        Blog de Sostenibilidad
                    </TabsTrigger>
                    <TabsTrigger value="galeria" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0055ff] data-[state=active]:text-[#0055ff] data-[state=active]:shadow-none rounded-none px-1 py-3 text-slate-600 font-medium">
                        Galería Muelle 24
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0055ff] data-[state=active]:text-[#0055ff] data-[state=active]:shadow-none rounded-none px-1 py-3 text-slate-600 font-medium">
                        SEO & Metadatos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inicio" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Editor Column */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Hero Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Hero Section</h2>
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">Publicado</span>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Título Principal</label>
                                        <Input
                                            value={mainSlide.title_es}
                                            onChange={(e) => {
                                                const newSlides = [...content.heroSlides];
                                                if (newSlides.length > 0) {
                                                    newSlides[0].title_es = e.target.value;
                                                    setContent({ ...content, heroSlides: newSlides });
                                                }
                                            }}
                                            className="bg-white border-slate-200 focus-visible:ring-[#0055ff]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Subtítulo</label>
                                        <Textarea
                                            rows={3}
                                            value={mainSlide.subtitle_es || ''}
                                            onChange={(e) => {
                                                const newSlides = [...content.heroSlides];
                                                if (newSlides.length > 0) {
                                                    newSlides[0].subtitle_es = e.target.value;
                                                    setContent({ ...content, heroSlides: newSlides });
                                                }
                                            }}
                                            placeholder="Experiencias inolvidables..."
                                            className="bg-white border-slate-200 focus-visible:ring-[#0055ff] resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Multimedia de Fondo (Video/Imagen)</label>
                                        <div
                                            onClick={() => heroInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-[#0055ff]/50 hover:bg-[#0055ff]/5 transition-colors cursor-pointer text-center group"
                                        >
                                            <div className="w-12 h-12 bg-slate-100 text-slate-400 group-hover:text-[#0055ff] group-hover:bg-[#0055ff]/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 mb-1">
                                                <span className="text-[#0055ff]">Sube un archivo</span> o arrastra y suelta
                                            </p>
                                            <p className="text-xs text-slate-500">PNG, JPG, MP4 hasta 50MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            ref={heroInputRef}
                                            onChange={handleHeroUpload}
                                            className="hidden"
                                            accept="image/*,video/mp4"
                                        />

                                        {/* Thumbnails */}
                                        {(mainSlide.image_url || mainSlide.video_url) && (
                                            <div className="flex gap-3 mt-4">
                                                {mainSlide.image_url && (
                                                    <div className="relative w-24 h-16 rounded-lg border-2 border-[#0055ff] overflow-hidden group">
                                                        <img src={mainSlide.image_url} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-[#0055ff]/20 flex items-center justify-center">
                                                            <div className="text-xs font-bold text-white uppercase bg-[#0055ff]/80 px-2 rounded">IMG</div>
                                                        </div>
                                                    </div>
                                                )}
                                                {mainSlide.video_url && (
                                                    <div className="relative w-24 h-16 rounded-lg border-2 border-[#0055ff] overflow-hidden group bg-slate-900 border-dashed">
                                                        <video src={mainSlide.video_url} className="w-full h-full object-cover opacity-50" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-xs font-bold text-white uppercase bg-[#0055ff]/80 px-2 rounded">MP4</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Stories */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Historias de Usuarios</h2>
                                    <button className="text-sm font-medium text-[#0055ff] hover:underline">Ver historial</button>
                                </div>
                                <div className="p-6">
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Seleccionar Historia para Editar</label>
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055ff] disabled:cursor-not-allowed disabled:opacity-50">
                                        <option>Amanecer en el Amazonas - Juan Pérez</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="space-y-6">
                            {/* Preview Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="p-5 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-800">Vista Previa Móvil</h2>
                                </div>
                                <div className="p-6 flex justify-center bg-slate-50/50">
                                    <div className="relative w-[300px] h-[600px] bg-slate-800 rounded-[40px] border-[12px] border-slate-800 shadow-xl overflow-hidden">
                                        {/* Notch */}
                                        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 w-32 mx-auto rounded-b-2xl z-20"></div>

                                        {/* Screen Content */}
                                        <div className="absolute inset-0 bg-white flex flex-col">
                                            {/* Hero Image / Video */}
                                            <div className="relative h-[280px] w-full bg-slate-200">
                                                {mainSlide.video_url ? (
                                                    <video src={mainSlide.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                                ) : mainSlide.image_url ? (
                                                    <img src={mainSlide.image_url} className="w-full h-full object-cover" />
                                                ) : null}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                                                <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8 text-center items-center">
                                                    <div className="text-white/80 text-[10px] uppercase tracking-widest font-semibold mb-2">Bluelake</div>
                                                    <h3 className="text-white text-2xl font-black leading-tight mb-2 drop-shadow-md">
                                                        {mainSlide.title_es || 'Título Principal'}
                                                    </h3>
                                                    {mainSlide.subtitle_es && (
                                                        <p className="text-white/80 text-xs line-clamp-2 max-w-[200px]">
                                                            {mainSlide.subtitle_es}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Fake Content Below */}
                                            <div className="p-6 space-y-4">
                                                <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
                                                <div className="space-y-2">
                                                    <div className="w-full h-2 bg-slate-100 rounded-full"></div>
                                                    <div className="w-5/6 h-2 bg-slate-100 rounded-full"></div>
                                                </div>
                                                <div className="pt-4">
                                                    <div className="text-xs font-bold text-slate-800 mb-3">Historias Recientes</div>
                                                    <div className="flex gap-2">
                                                        <div className="w-24 h-32 bg-slate-100 rounded-xl"></div>
                                                        <div className="w-24 h-32 bg-slate-100 rounded-xl"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Muelle 24 Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Galería Muelle 24</h2>
                                    <button className="text-sm font-medium text-[#0055ff] hover:underline">Gestionar</button>
                                </div>
                                <div className="p-5 flex gap-2">
                                    <div className="w-16 h-20 rounded bg-slate-100 overflow-hidden shadow-sm">
                                        <img src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=200" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-16 h-20 rounded bg-slate-100 overflow-hidden shadow-sm">
                                        <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-16 h-20 rounded bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="blog">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Artículos del Blog</h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#0055ff]/10 text-[#0055ff] hover:bg-[#0055ff]/20 font-medium rounded-lg transition-colors">
                                <Plus className="w-4 h-4" /> Nuevo Artículo
                            </button>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Título</th>
                                        <th className="px-4 py-3 font-medium">Estado</th>
                                        <th className="px-4 py-3 font-medium">Fecha</th>
                                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">Protección del Delfín Rosado</td>
                                        <td className="px-4 py-3"><span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">Publicado</span></td>
                                        <td className="px-4 py-3 text-slate-500">12 Oct 2023</td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-[#0055ff] hover:underline text-xs font-medium">Editar</button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">Reciclaje en Muelle 24</td>
                                        <td className="px-4 py-3"><span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">Borrador</span></td>
                                        <td className="px-4 py-3 text-slate-500">05 Nov 2023</td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-[#0055ff] hover:underline text-xs font-medium">Editar</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="galeria">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Banco de Imágenes Muelle 24</h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#0055ff] text-white hover:bg-[#0044cc] font-medium rounded-lg transition-colors">
                                <Upload className="w-4 h-4" /> Subir Fotos
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="group relative aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                    <img src={`https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=400&q=80&sig=${i}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 hover:scale-105 transition-all shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-[4/5] rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0055ff]/50 hover:bg-[#0055ff]/5 transition-colors flex flex-col items-center justify-center text-slate-500 cursor-pointer">
                                <Plus className="w-8 h-8 mb-2 text-slate-400" />
                                <span className="text-xs font-medium">Añadir más</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="seo">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6 max-w-3xl">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-800">Ajustes Globales de SEO</h2>
                            <p className="text-sm text-slate-500 mt-1">Configura cómo aparece tu sitio en Google y redes sociales.</p>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Meta Título Global</label>
                                <Input defaultValue="Bluelake Experiencia - Turismo en la Selva Peruana" className="bg-slate-50 border-slate-200" />
                                <p className="text-xs text-slate-500 mt-1.5">Ideal: 50-60 caracteres.</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Meta Descripción</label>
                                <Textarea rows={3} defaultValue="Descubre la selva peruana de forma exclusiva. Deportes acuáticos, pesca, relax y aventuras únicas con guías expertos." className="bg-slate-50 border-slate-200 resize-none" />
                                <p className="text-xs text-slate-500 mt-1.5">Aparecerá debado del título en los resultados de búsqueda.</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Imagen para Redes Sociales (OG Image)</label>
                                <div className="flex gap-4 items-center">
                                    <div className="w-32 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=400" className="w-full h-full object-cover" />
                                    </div>
                                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                                        Cambiar Imagen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminContenido;
