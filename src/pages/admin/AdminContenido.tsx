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
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-500">Módulo de Blog de Sostenibilidad en desarrollo.</p>
                    </div>
                </TabsContent>

                <TabsContent value="galeria">
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-500">Módulo de Galería en desarrollo.</p>
                    </div>
                </TabsContent>

                <TabsContent value="seo">
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-500">Módulo de configuración de Metadatos en desarrollo.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminContenido;
