import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Rocket, ShieldCheck, HeartPulse, CheckSquare } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const values: string[] = t('about.values', { returnObjects: true }) as string[];
    const whyChooseUs: string[] = t('about.whyChooseUs', { returnObjects: true }) as string[];

    return (
        <>
            <Helmet>
                <title>{t('about.title')} — Bluelake | Operador Turístico</title>
                <meta name="description" content={t('about.description1')} />
            </Helmet>

            <Navbar />

            <main className="min-h-screen bg-background pt-20">
                {/* About Hero Section */}
                <section className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1518182170546-0766de6b6aad?w=1920&q=85"
                            alt="Amazonia Bluelake"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 container-bluelake text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm mb-6"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-accent-orange animate-pulse" />
                            {t('about.badge')}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
                        >
                            {t('about.title')}
                        </motion.h1>
                    </div>
                </section>

                {/* Introduction Section */}
                <section className="py-16 md:py-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-secondary rounded-l-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="container-bluelake relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl md:text-3xl text-foreground font-medium leading-relaxed"
                            >
                                {t('about.description1')}
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-muted-foreground leading-relaxed"
                            >
                                {t('about.description2')}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="p-8 bg-secondary/30 rounded-3xl border border-secondary"
                            >
                                <p className="text-xl text-primary-deep font-medium leading-relaxed">
                                    "{t('about.description4')}"
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="py-16 bg-muted/30">
                    <div className="container-bluelake">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                            {/* Misión */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-card p-10 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
                                    <Target className="w-8 h-8 text-accent-orange" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">{t('about.missionTitle')}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    {t('about.mission')}
                                </p>
                            </motion.div>

                            {/* Visión */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-card p-10 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                                    <Rocket className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">{t('about.visionTitle')}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    {t('about.vision')}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-20 md:py-28 relative">
                    <div className="container-bluelake max-w-5xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                                <HeartPulse className="w-8 h-8 text-destructive" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('about.valuesTitle')}</h3>
                            <p className="text-lg text-muted-foreground">Pilares que sostienen cada experiencia que creamos.</p>
                        </motion.div>

                        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                            {values.map((v, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="px-6 py-3 bg-secondary text-primary rounded-xl text-lg font-medium border border-primary/10 shadow-sm"
                                >
                                    {v}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="pb-24">
                    <div className="container-bluelake">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-primary-deep text-white rounded-[2.5rem] p-10 md:p-16 lg:p-20 relative overflow-hidden max-w-6xl mx-auto"
                        >
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-orange rounded-full blur-[80px] opacity-20 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row gap-8 items-center mb-12 border-b border-white/10 pb-12">
                                    <div className="shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <ShieldCheck className="w-10 h-10 text-accent-orange" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl md:text-5xl font-bold mb-4">{t('about.whyChooseUsTitle')}</h3>
                                        <p className="text-xl text-white/80">{t('about.description3')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                                    {whyChooseUs.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex gap-4 items-start"
                                        >
                                            <div className="shrink-0 mt-1">
                                                <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center">
                                                    <CheckSquare className="w-4 h-4 text-accent-orange" />
                                                </div>
                                            </div>
                                            <p className="text-white/90 leading-relaxed text-lg">{item}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

            </main>
            <Footer />
        </>
    );
};

export default AboutPage;
