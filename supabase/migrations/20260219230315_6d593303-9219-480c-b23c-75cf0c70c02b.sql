
-- Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de roles (SEPARADA por seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Función de seguridad para verificar roles (SECURITY DEFINER evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabla de configuración estacional
CREATE TABLE public.seasonal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'manual')),
  current_season TEXT NOT NULL DEFAULT 'winter' CHECK (current_season IN ('winter', 'summer')),
  override_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO public.seasonal_config (mode, current_season, override_active) VALUES ('auto', 'winter', false);

-- Tabla de tours
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'adventure',
  season TEXT NOT NULL DEFAULT 'all' CHECK (season IN ('winter', 'summer', 'all')),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  child_price DECIMAL(10,2) DEFAULT 0,
  dynamic_pricing BOOLEAN DEFAULT false,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  premium BOOLEAN DEFAULT false,
  requires_quote BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_es TEXT,
  description_en TEXT,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de reservas
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL NOT NULL,
  dates DATE[] NOT NULL DEFAULT '{}',
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'full' CHECK (payment_mode IN ('full', 'partial')),
  payment_method TEXT NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('transfer', 'card')),
  card_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de blog posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_es TEXT,
  content_en TEXT,
  excerpt_es TEXT,
  excerpt_en TEXT,
  meta_title TEXT,
  meta_description TEXT,
  image_url TEXT,
  category TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de solicitudes corporativas
CREATE TABLE public.corporate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  group_size INTEGER,
  requested_dates TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_requests ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Policies: user_roles (solo admins gestionan roles)
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Policies: seasonal_config (público lectura, solo admin escribe)
CREATE POLICY "Anyone can read seasonal config" ON public.seasonal_config FOR SELECT USING (true);
CREATE POLICY "Admins can update seasonal config" ON public.seasonal_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies: tours (público lectura, solo admin escribe)
CREATE POLICY "Anyone can view visible tours" ON public.tours FOR SELECT USING (visible = true);
CREATE POLICY "Admins can manage tours" ON public.tours FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies: bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can create booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies: blog_posts
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policies: corporate_requests
CREATE POLICY "Anyone can submit corporate request" ON public.corporate_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage corporate requests" ON public.corporate_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ================================
-- TRIGGERS
-- ================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger: auto-crear perfil en signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corporate_requests_updated_at BEFORE UPDATE ON public.corporate_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seasonal_config_updated_at BEFORE UPDATE ON public.seasonal_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para imágenes de tours
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-images', 'tour-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Policies storage
CREATE POLICY "Public tour images" ON storage.objects FOR SELECT USING (bucket_id = 'tour-images');
CREATE POLICY "Admins upload tour images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tour images" ON storage.objects FOR UPDATE USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tour images" ON storage.objects FOR DELETE USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Admins upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));
