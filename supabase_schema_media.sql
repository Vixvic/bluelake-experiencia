-- ==============================================================================
-- 1. MODIFICAR TABLA TOURS Existente
-- ==============================================================================
-- Agregamos la columna de la url de la imagen si no existe
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS image_url text;

-- ==============================================================================
-- 2. TABLA HERO SLIDES (Carrusel Principal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url text NOT NULL,
    title_es text NOT NULL,
    title_en text NOT NULL,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para hero_slides
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "hero_slides_read_access" ON public.hero_slides FOR SELECT USING (true);

-- Políticas: Escritura administrador
CREATE POLICY "hero_slides_admin_all" ON public.hero_slides 
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

-- ==============================================================================
-- 3. TABLA FEATURED EVENTS (Eventos Destacados / Ex Muelle 24)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.featured_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title_es text NOT NULL,
    title_en text NOT NULL,
    subtitle_es text,
    subtitle_en text,
    description_es text,
    description_en text,
    features_es text[] DEFAULT '{}',
    features_en text[] DEFAULT '{}',
    image_urls text[] DEFAULT '{}',
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para featured_events
ALTER TABLE public.featured_events ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública
CREATE POLICY "featured_events_read_access" ON public.featured_events FOR SELECT USING (true);

-- Políticas: Escritura administrador
CREATE POLICY "featured_events_admin_all" ON public.featured_events 
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

-- Insertar un evento destacado por defecto para que la página pública no quede vacía
INSERT INTO public.featured_events (title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, features_es, features_en, active)
VALUES (
    'Muelle 24',
    'Pier 24',
    'Experiencia Premium y Velocidad',
    'Premium Experience and Speed',
    'Vaciante y playas naturales. El río baja revelando playas de arena blanca. Deportes acuáticos, Muelle 24 y velocidad en el Amazonas.',
    'Low water season and natural beaches. The river drops revealing white sand beaches. Enjoy water sports, Pier 24, and speed on the Amazon.',
    ARRAY['Balsas flotantes', 'Pesca artesanal', 'Kayak y Paddle', 'Ski acuático y motos acuáticas', 'Tubbing extremo', 'Muelle 24: full days, estadías y casa exclusiva'],
    ARRAY['Floating rafts', 'Artisanal fishing', 'Kayak and Paddle', 'Water ski and jet skis', 'Extreme tubing', 'Pier 24: full days, stays, and exclusive house']
);
