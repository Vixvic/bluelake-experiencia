import React, { useState, useEffect, useRef } from 'react';
import { siteContentService, SiteContent, HeroSlide, FeaturedEvent } from '@/services/siteContentService';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Upload, Star, LayoutDashboard, ChevronRight, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ViewLiveSiteButton } from '@/components/admin/ViewLiveSiteButton';

const AdminSettings: React.FC = () => {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'hero' | 'featured'>('hero');

    // Referencias para disparadores de subida
    const heroInputRef = useRef<HTMLInputElement>(null);
    const featuredInputRef = useRef<HTMLInputElement>(null);
    const [uploadingHeroIndex, setUploadingHeroIndex] = useState<number | null>(null);

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

    const handleImageUpload = async (file: File, type: 'hero' | 'featured', index?: number) => {
        try {
            console.log('Iniciando handleImageUpload:', { type, index, fileName: file.name, fileSize: file.size });
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `settings/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tour-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error de subida en Supabase:', uploadError);
                throw uploadError;
            }
            console.log('Subida exitosa a Supabase, obteniendo URL pública.');

            const { data: { publicUrl } } = supabase.storage
                .from('tour-images')
                .getPublicUrl(filePath);

            if (type === 'hero' && index !== undefined && content) {
                const newSlides = [...content.heroSlides];
                newSlides[index].image_url = publicUrl;
                setContent({ ...content, heroSlides: newSlides });
            } else if (type === 'featured' && content) {
                // Para galería de destacados (limitado a 5)
                const currentImages = content.featuredEvent.images || [];
                if (currentImages.length >= 5) {
                    toast.error('Máximo 5 imágenes permitidas en destacados');
                    return;
                }
                setContent({
                    ...content,
                    featuredEvent: {
                        ...content.featuredEvent,
                        images: [...currentImages, publicUrl]
                    }
                });
            }
            console.log('Estado actualizado con nueva URL:', publicUrl);
            toast.success('Imagen subida');
        } catch (error: any) {
            toast.error('Error subiendo imagen: ' + error.message);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    if (!content) return <div className="p-8 text-center text-muted-foreground">Error cargando configuración.</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Ajustes de Inicio</h1>
                    <p className="text-sm text-muted-foreground">Gestiona el contenido visual de la página principal.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ViewLiveSiteButton />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Proyecto
                    </button>
                </div>
            </div>

            <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit">
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'hero' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Carrusel Principal (Hero)
                </button>
                <button
                    onClick={() => setActiveTab('featured')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'featured' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Experiencia Destacada
                </button>
            </div>

            {activeTab === 'hero' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold">Diapositivas del Carrusel</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dimensiones sugeridas <span className="font-semibold text-foreground">1920 × 1080 px</span>. Usa imágenes horizontales de alta resolución.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const newSlide: HeroSlide = {
                                    id: Date.now().toString(),
                                    image_url: '',
                                    title_es: 'Nueva Diapositiva',
                                    title_en: 'New Slide',
                                    order: content.heroSlides.length
                                };
                                setContent({ ...content, heroSlides: [...content.heroSlides, newSlide] });
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg border border-border"
                        >
                            <Plus className="w-4 h-4" /> Agregar Slide
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {content.heroSlides.map((slide, index) => (
                            <div key={slide.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start relative group">
                                <div className="w-40 h-24 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border group-hover:border-primary/50 transition-colors relative">
                                    {slide.image_url ? (
                                        <img src={slide.image_url} className="w-full h-full object-cover" alt="Slide" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <ImageIcon className="w-8 h-8 opacity-20" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadingHeroIndex(index);
                                            heroInputRef.current?.click();
                                        }}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    >
                                        <Upload className="text-white w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Título (ES)</label>
                                        <Input
                                            value={slide.title_es}
                                            onChange={e => {
                                                const newSlides = [...content.heroSlides];
                                                newSlides[index].title_es = e.target.value;
                                                setContent({ ...content, heroSlides: newSlides });
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Título (EN)</label>
                                        <Input
                                            value={slide.title_en}
                                            onChange={e => {
                                                const newSlides = [...content.heroSlides];
                                                newSlides[index].title_en = e.target.value;
                                                setContent({ ...content, heroSlides: newSlides });
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">URL Imagen (Directo)</label>
                                        <Input
                                            value={slide.image_url}
                                            onChange={e => {
                                                const newSlides = [...content.heroSlides];
                                                newSlides[index].image_url = e.target.value;
                                                setContent({ ...content, heroSlides: newSlides });
                                            }}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const newSlides = content.heroSlides.filter((_, i) => i !== index);
                                        setContent({ ...content, heroSlides: newSlides });
                                    }}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg self-center"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Input oculto centralizado para el Hero */}
                    <input
                        type="file"
                        ref={heroInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            console.log('Seleccionado archivo para Hero:', file?.name, 'Indice:', uploadingHeroIndex);
                            if (file && uploadingHeroIndex !== null) {
                                toast.info('Subiendo imagen del carrusel...');
                                handleImageUpload(file, 'hero', uploadingHeroIndex).finally(() => {
                                    e.target.value = '';
                                    setUploadingHeroIndex(null);
                                });
                            }
                        }}
                    />
                </div>
            )}

            {activeTab === 'featured' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Detalles de la Experiencia Destacada</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Activa</span>
                                <input
                                    type="checkbox"
                                    checked={content.featuredEvent.active}
                                    onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, active: e.target.checked } })}
                                    className="w-4 h-4 text-primary rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Título Principal (ES)</label>
                                <Input value={content.featuredEvent.title_es} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, title_es: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Título Principal (EN)</label>
                                <Input value={content.featuredEvent.title_en} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, title_en: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Subtítulo (ES)</label>
                                <Input value={content.featuredEvent.subtitle_es} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, subtitle_es: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Subtítulo (EN)</label>
                                <Input value={content.featuredEvent.subtitle_en} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, subtitle_en: e.target.value } })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Descripción (ES)</label>
                                <Textarea rows={4} value={content.featuredEvent.description_es} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, description_es: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Descripción (EN)</label>
                                <Textarea rows={4} value={content.featuredEvent.description_en} onChange={e => setContent({ ...content, featuredEvent: { ...content.featuredEvent, description_en: e.target.value } })} />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3">
                                <label className="text-sm font-semibold block">Galería Destacada (Máx 5)</label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dimensiones sugeridas <span className="font-semibold text-foreground">1920 × 1080 px</span>. Usa imágenes horizontales de alta resolución.
                                </p>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {content.featuredEvent.images.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => {
                                                const newImages = content.featuredEvent.images.filter((_, i) => i !== index);
                                                setContent({ ...content, featuredEvent: { ...content.featuredEvent, images: newImages } });
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {content.featuredEvent.images.length < 5 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => featuredInputRef.current?.click()}
                                            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary"
                                        >
                                            <Plus className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] font-bold uppercase">Subir</span>
                                        </button>
                                        <input
                                            type="file"
                                            ref={featuredInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    toast.info('Subiendo imagen destacada...');
                                                    handleImageUpload(file, 'featured').finally(() => {
                                                        e.target.value = '';
                                                    });
                                                }
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
