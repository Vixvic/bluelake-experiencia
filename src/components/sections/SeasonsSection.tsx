import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Snowflake, Sun, CheckCircle2 } from 'lucide-react';
import { useSeasonalContext } from '@/contexts/SeasonalContext';

const SeasonsSection: React.FC = () => {
  const { t } = useTranslation();
  const { activeSeason, selectedSeason, setSelectedSeason } = useSeasonalContext();

  const seasons = [
    {
      key: 'winter' as const,
      icon: Snowflake,
      color: 'from-blue-600 to-primary',
      bgActive: 'bg-gradient-to-br from-blue-600 to-primary',
      borderActive: 'border-primary',
    },
    {
      key: 'summer' as const,
      icon: Sun,
      color: 'from-orange-400 to-accent-orange',
      bgActive: 'bg-gradient-to-br from-orange-400 to-accent-orange',
      borderActive: 'border-accent-orange',
    },
  ];

  return (
    <section id="temporadas" className="section-padding bg-secondary/30">
      <div className="container-bluelake">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('seasons.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('seasons.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {seasons.map(({ key, icon: Icon, bgActive, borderActive }, i) => {
            const isActive = activeSeason === key;
            const isSelected = selectedSeason === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                onClick={() => setSelectedSeason(key)}
                className={`relative rounded-2xl border-2 h-full flex flex-col cursor-pointer transition-all duration-300 overflow-hidden ${isSelected
                    ? `${borderActive} shadow-lg scale-[1.02]`
                    : 'border-border hover:border-primary/40 hover:shadow-md'
                  }`}
              >
                {/* Active badge */}
                {isActive && (
                  <div className={`absolute top-4 right-4 z-10 ${bgActive} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {t('seasons.activeBadge')}
                  </div>
                )}

                {/* Card content */}
                <div className={`p-8 flex-1 flex flex-col ${isSelected ? bgActive : 'bg-card'} transition-all duration-300`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isSelected ? 'bg-white/20' : 'bg-primary/10'
                    }`}>
                    <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  </div>

                  <h3 className={`text-2xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-foreground'}`}>
                    {t(`seasons.${key}.name`)}
                  </h3>
                  <p className={`text-sm font-medium mb-4 ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {t(`seasons.${key}.period`)}
                  </p>
                  <p className={`text-sm leading-relaxed mb-6 ${isSelected ? 'text-white/85' : 'text-muted-foreground'}`}>
                    {t(`seasons.${key}.description`)}
                  </p>

                  <ul className="space-y-2">
                    {(t(`seasons.${key}.activities`, { returnObjects: true }) as string[]).map((activity) => (
                      <li key={activity} className={`flex items-center gap-2.5 text-sm font-medium ${isSelected ? 'text-white' : 'text-foreground'
                        }`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white/70' : 'text-jungle'}`} />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SeasonsSection;
