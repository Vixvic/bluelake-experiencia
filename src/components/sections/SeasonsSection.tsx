import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, Volume2, VolumeX, X } from 'lucide-react';
import { useSeasonalContext } from '@/contexts/SeasonalContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';

interface FeaturedTour {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  video_url: string;
  season: string;
}

const defaultVideos = {
  winter: 'https://cdn.pixabay.com/video/2019/11/12/29035-373264475_large.mp4',
  summer: 'https://cdn.pixabay.com/video/2021/08/17/85376-589550711_large.mp4'
}; // Fallback videos for demo if no real videos are provided by admin

const SeasonsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedSeason, setSelectedSeason } = useSeasonalContext();
  const [featuredTour, setFeaturedTour] = useState<FeaturedTour | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select('id, title_es, title_en, description_es, description_en, category, image_url, video_url, season')
        .eq('is_season_featured', true)
        .eq('season', selectedSeason)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        const isEn = i18n.language === 'en';
        setFeaturedTour({
          id: data.id,
          title: isEn ? (data.title_en || data.title_es) : data.title_es,
          description: isEn ? (data.description_en || data.description_es) : data.description_es,
          category: data.category,
          image_url: data.image_url,
          video_url: data.video_url || defaultVideos[selectedSeason as 'winter' | 'summer'],
          season: data.season,
        });
      } else {
        // Fallback si no hay ningún tour destacado en esa temporada
        setFeaturedTour(null);
      }
      setLoading(false);
    };

    fetchFeatured();
  }, [selectedSeason, i18n.language]);

  // Colores dinámicos basados en la temporada seleccionada para el contenedor padre
  const seasonColors = {
    winter: 'bg-slate-950 text-slate-100', // Invierno: Tonos oscuros/fríos
    summer: 'bg-slate-900 border-accent-orange/20 text-orange-50', // Verano: Tonos ligeramente más cálidos/oscuros
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentThemeClass = selectedSeason === 'winter' ? seasonColors.winter : seasonColors.summer;
  const isYoutube = featuredTour?.video_url?.includes('youtube.com') || featuredTour?.video_url?.includes('youtu.be');
  const ytId = isYoutube ? getYoutubeId(featuredTour!.video_url) : null;

  return (
    <>
      <section id="temporadas" className={`transition-colors duration-1000 py-16 md:py-24 ${currentThemeClass}`}>
        <div className="container-bluelake">

          {/* Cabecera y Controles */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 mt-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
                {t('seasons.title')}
              </h2>
              <p className="text-lg opacity-70">
                {t('seasons.subtitle')}
              </p>
            </motion.div>

            {/* Selector Tipo Switch Cinemático */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex bg-slate-800/60 p-1.5 rounded-full border border-slate-700/50 self-start lg:self-auto backdrop-blur-sm"
            >
              <button
                onClick={() => setSelectedSeason('winter')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${selectedSeason === 'winter'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {t('seasons.winter.name')}
              </button>
              <button
                onClick={() => setSelectedSeason('summer')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${selectedSeason === 'summer'
                  ? 'bg-accent-orange text-white shadow-lg shadow-orange-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {t('seasons.summer.name')}
              </button>
            </motion.div>
          </div>

          {/* Featured Cinematic Banner */}
          <motion.div
            key={selectedSeason} // Force re-render animation on change
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`relative w-full rounded-[2rem] overflow-hidden shadow-2xl border ${selectedSeason === 'summer' ? 'border-orange-500/20 shadow-orange-900/20' : 'border-blue-500/20 shadow-blue-900/20'} min-h-[500px] md:min-h-[600px] lg:h-[70vh] max-h-[800px] group bg-slate-900`}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : featuredTour ? (
              <>
                {/* Background Media */}
                <div className="absolute inset-0 w-full h-full">
                  {!isYoutube ? (
                    <video
                      ref={videoRef}
                      src={featuredTour.video_url}
                      className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]"
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      crossOrigin="anonymous"
                      poster={featuredTour.image_url}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full scale-110 pointer-events-none opacity-80">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&showinfo=0`}
                        title="Background Video"
                        className="w-full h-full object-cover scale-[1.5]"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Gradientes Oscuros para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-transparent"></div>
                </div>

                {/* Contenido (Textos y Botones) */}
                <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-end">

                  {/* Badges Inferior Izquierda (Opcional, estilo cine) */}
                  <div className="absolute bottom-8 left-8 hidden lg:flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-white/20 bg-black/40 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white/70">4K HDR</span>
                    <span className="px-2 py-0.5 border border-white/20 bg-black/40 backdrop-blur-md rounded text-[10px] font-bold tracking-widest text-white/70">5.1</span>
                  </div>

                  <div className="max-w-2xl relative z-10 lg:pl-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="mb-3"
                    >
                      <span className={`inline-block px-3 py-1 rounded-sm text-xs font-bold tracking-widest uppercase mb-4 ${selectedSeason === 'winter' ? 'bg-blue-600 text-white' : 'bg-accent-orange text-white'}`}>
                        {t('experiences.premium')}
                      </span>
                      <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 drop-shadow-lg">
                        {featuredTour.title}
                      </h3>
                      <p className="text-base md:text-lg text-slate-200 mb-6 drop-shadow-md line-clamp-3 leading-relaxed">
                        {featuredTour.description}
                      </p>

                      <div className="flex flex-col gap-1.5 mb-8 text-sm text-slate-300">
                        <p><span className="font-semibold text-white">Participan:</span> Guías Locales, Tú</p>
                        <p><span className="font-semibold text-white">Categoría:</span> {featuredTour.category.charAt(0).toUpperCase() + featuredTour.category.slice(1).replace(/-/g, ' ')}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="flex flex-wrap items-center gap-3 lg:gap-4"
                    >
                      <button
                        onClick={() => setIsVideoModalOpen(true)}
                        className="flex items-center gap-2.5 px-6 md:px-8 py-3 bg-white text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-slate-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      >
                        <Play className="w-5 h-5 fill-slate-900" />
                        Reproducir
                      </button>

                      <button
                        onClick={() => {
                          const experiencesEl = document.getElementById('experiencias');
                          if (experiencesEl) experiencesEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center justify-center size-12 bg-slate-800/60 backdrop-blur-md border border-slate-600 rounded-lg text-white hover:bg-slate-700 hover:border-slate-400 transition-all hover:scale-105"
                        title="Ver más"
                      >
                        <Plus className="w-5 h-5" />
                      </button>

                      <button
                        className="flex items-center justify-center size-12 bg-slate-800/60 backdrop-blur-md border border-slate-600 rounded-lg text-white hover:bg-slate-700 hover:border-slate-400 transition-all hover:scale-105"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>

                      {!isYoutube && (
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="ml-auto hidden sm:flex items-center justify-center size-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 transition-all"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                      )}
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              // Fallback Design if no featured tour is found
              <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center bg-slate-800">
                <div className="w-20 h-20 mb-6 bg-slate-700 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-500 ml-1" />
                </div>
                <h3 className="text-3xl font-bold text-slate-300 mb-3">La Aventura te Espera</h3>
                <p className="text-slate-400 max-w-md">Selecciona un tour en el panel de administrador y márcalo como "Destacado de Temporada" para que aparezca aquí.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Video Modal (Reproductor Inmersivo) */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[90vh] p-0 bg-black border-none overflow-hidden rounded-2xl shadow-2xl flex flex-col justify-center">
          <DialogTitle className="sr-only">Reproductor de Video</DialogTitle>
          {featuredTour && isVideoModalOpen && (
            <div className="relative w-full h-full max-h-[90vh] bg-black group aspect-video flex items-center justify-center">
              {isYoutube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&rel=0`}
                  title="Video Trailer"
                  className="w-full h-full rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={featuredTour.video_url}
                  className="w-full h-full object-contain max-h-[90vh] rounded-2xl"
                  controls
                  autoPlay
                  preload="auto"
                />
              )}
              <DialogClose className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white border border-white/20 transition-all z-50">
                <X className="w-6 h-6" />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeasonsSection;
