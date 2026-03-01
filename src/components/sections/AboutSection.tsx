import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Rocket, Target, ShieldCheck, HeartPulse, CheckSquare } from 'lucide-react';

const AboutSection: React.FC = () => {
    const { t } = useTranslation();

    const values: string[] = t('about.values', { returnObjects: true }) as string[];
    const whyChooseUs: string[] = t('about.whyChooseUs', { returnObjects: true }) as string[];

    return (
        <section id="nosotros" className="py-24 bg-white relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-secondary rounded-l-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/4 h-[400px] bg-primary/10 rounded-r-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="container-bluelake relative z-10 w-full">
                {/* Cabecera de Sección */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary font-medium text-sm mb-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-accent-orange animate-pulse" />
                        {t('about.badge')}
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold text-foreground mb-6"
                    >
                        {t('about.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground leading-relaxed"
                    >
                        {t('about.description1')}
                    </motion.p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">

                    {/* Columna Izquierda: Descripción */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <p className="text-foreground/80 leading-relaxed">
                            {t('about.description2')}
                        </p>
                        <p className="text-foreground/80 leading-relaxed font-medium">
                            {t('about.description3')}
                        </p>
                        <div className="p-6 bg-secondary/40 rounded-2xl border border-secondary">
                            <p className="text-primary-deep leading-relaxed">
                                {t('about.description4')}
                            </p>
                        </div>
                    </motion.div>

                    {/* Columna Derecha: Misión y Visión */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col gap-6 justify-center"
                    >
                        {/* Misión */}
                        <div className="flex gap-5">
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                                <Target className="w-6 h-6 text-accent-orange" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{t('about.missionTitle')}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('about.mission')}
                                </p>
                            </div>
                        </div>

                        {/* Visión */}
                        <div className="flex gap-5">
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                                <Rocket className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{t('about.visionTitle')}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('about.vision')}
                                </p>
                            </div>
                        </div>

                        {/* Valores en Tags */}
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-destructive" />
                                {t('about.valuesTitle')}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {values.map((v, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-primary rounded-lg text-sm font-medium">
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Por qué elegirnos full width */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-primary-deep text-white rounded-3xl p-8 md:p-12 relative overflow-hidden"
                >
                    {/* Decoración dentro del recuadro */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-orange rounded-full blur-3xl opacity-20 pointer-events-none" />

                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-accent-orange" />
                            {t('about.whyChooseUsTitle')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {whyChooseUs.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start">
                                    <CheckSquare className="w-5 h-5 text-accent-orange shrink-0 mt-0.5" />
                                    <p className="text-white/80 leading-relaxed text-sm md:text-base">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default AboutSection;
