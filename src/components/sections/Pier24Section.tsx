import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import { siteContentService, FeaturedEvent } from '@/services/siteContentService';

const DEFAULT_FEATURED: FeaturedEvent = {
  title_es: 'Muelle 24',
  title_en: 'Pier 24',
  subtitle_es: 'Experiencia Premium y Velocidad',
  subtitle_en: 'Premium Experience and Speed',
  description_es: 'Vaciante y playas naturales. El río baja revelando playas de arena blanca. Deportes acuáticos, Muelle 24 y velocidad en el Amazonas.',
  description_en: 'Low water season and natural beaches. The river drops revealing white sand beaches. Enjoy water sports, Pier 24, and speed on the Amazon.',
  features_es: ['Balsas flotantes', 'Pesca artesanal', 'Kayak y Paddle', 'Ski acuático y motos acuáticas', 'Tubbing extremo', 'Muelle 24: full days, estadías y casa exclusiva'],
  features_en: ['Floating rafts', 'Artisanal fishing', 'Kayak and Paddle', 'Water ski and jet skis', 'Extreme tubing', 'Pier 24: full days, stays, and exclusive house'],
  images: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600'
  ],
  active: true
};

const FeaturedEventSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = React.useState<FeaturedEvent>(DEFAULT_FEATURED);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    siteContentService.getContent().then(content => {
      if (content.featuredEvent) {
        setData(content.featuredEvent);
      }
      setLoading(false);
    });
  }, []);

  if (!data.active && !loading) return null;

  const title = i18n.language === 'es' ? data.title_es : data.title_en;
  const subtitle = i18n.language === 'es' ? data.subtitle_es : data.subtitle_en;
  const description = i18n.language === 'es' ? data.description_es : data.description_en;
  const features = i18n.language === 'es' ? data.features_es : data.features_en;
  const images = data.images.length > 0 ? data.images : DEFAULT_FEATURED.images;

  return (
    <section id="muelle24" className="section-padding bg-gradient-premium text-white relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-bluelake relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent-orange/20 border border-accent-orange/30 rounded-full px-4 py-2 text-accent-orange text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              {t('pier24.badge')}
            </div>

            <h2 className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight">
              {title}
            </h2>
            <p className="text-accent-orange text-xl font-medium mb-6">
              {subtitle}
            </p>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              {description}
            </p>

            <ul className="space-y-3 mb-10">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-orange shrink-0" />
                  <span className="text-white/85 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contacto">
                <button className="px-8 py-4 bg-accent-orange hover:bg-accent-orange-hover text-white font-bold rounded-full text-lg transition-all shadow-orange hover:scale-105 flex items-center gap-2">
                  {t('pier24.cta')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </a>
              <p className="text-white/40 text-sm self-center">{t('pier24.ctaSub')}</p>
            </div>
          </motion.div>

          {/* Right: Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden h-52">
                  <img
                    src={images[0]}
                    alt={`${title} 1`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images[1] && (
                  <div className="rounded-2xl overflow-hidden h-36">
                    <img
                      src={images[1]}
                      alt={`${title} 2`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4 mt-8">
                {images[2] && (
                  <div className="rounded-2xl overflow-hidden h-36">
                    <img
                      src={images[2]}
                      alt={`${title} 3`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {images[3] && (
                  <div className="rounded-2xl overflow-hidden h-52">
                    <img
                      src={images[3]}
                      alt={`${title} 4`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {images[4] && (
                  <div className="rounded-2xl overflow-hidden h-36 hidden md:block">
                    <img
                      src={images[4]}
                      alt={`${title} 5`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent-orange fill-accent-orange" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Experiencia #1</div>
                  <div className="text-xs text-muted-foreground">Iquitos, Amazonía</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventSection;
