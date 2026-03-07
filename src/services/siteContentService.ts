import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
    id: string;
    image_url: string;
    video_url?: string; // Para extender a full con video background
    title_es: string;
    title_en: string;
    subtitle_es?: string;
    subtitle_en?: string;
    order: number;
}

export interface FeaturedEvent {
    title_es: string;
    title_en: string;
    subtitle_es: string;
    subtitle_en: string;
    description_es: string;
    description_en: string;
    features_es: string[];
    features_en: string[];
    images: string[];
    active: boolean;
}

export interface SiteContent {
    heroSlides: HeroSlide[];
    featuredEvent: FeaturedEvent;
}

const SETTINGS_PATH = 'settings/site-content.json';
const BUCKET_NAME = 'tour-images';

const DEFAULT_CONTENT: SiteContent = {
    heroSlides: [
        {
            id: '1',
            image_url: 'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=1920&q=85',
            title_es: 'Ski Acuático',
            title_en: 'Water Skiing',
            order: 0
        }
    ],
    featuredEvent: {
        title_es: 'Muelle 24',
        title_en: 'Pier 24',
        subtitle_es: 'Experiencia Premium y Velocidad',
        subtitle_en: 'Premium Experience and Speed',
        description_es: 'Vaciante y playas naturales. El río baja revelando playas de arena blanca. Deportes acuáticos, Muelle 24 y velocidad en el Amazonas.',
        description_en: 'Low water season and natural beaches. The river drops revealing white sand beaches. Enjoy water sports, Pier 24, and speed on the Amazon.',
        features_es: ['Balsas flotantes', 'Pesca artesanal', 'Kayak y Paddle', 'Ski acuático y motos acuáticas', 'Tubbing extremo', 'Muelle 24: full days, estadías y casa exclusiva'],
        features_en: ['Floating rafts', 'Artisanal fishing', 'Kayak and Paddle', 'Water ski and jet skis', 'Extreme tubing', 'Pier 24: full days, stays, and exclusive house'],
        images: [],
        active: true
    }
};

export const siteContentService = {
    async getContent(): Promise<SiteContent> {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(SETTINGS_PATH);

            if (error) {
                if (error.message.includes('Object not found')) {
                    console.log('Settings file not found, using default content');
                    return DEFAULT_CONTENT;
                }
                throw error;
            }

            const text = await data.text();
            return JSON.parse(text);
        } catch (err) {
            console.error('Error fetching site content:', err);
            return DEFAULT_CONTENT;
        }
    },

    async updateContent(content: SiteContent): Promise<void> {
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(SETTINGS_PATH, blob, {
                upsert: true,
                contentType: 'application/json'
            });

        if (error) throw error;
    }
};
