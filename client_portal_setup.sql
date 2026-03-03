-- ==========================================
-- SETUP: PORTAL DE CLIENTES BLUELAKE (v3)
-- Completamente idempotente: no falla aunque
-- la tabla/columnas ya existan.
-- ==========================================

-- 1. Asegurar que la tabla profiles existe con todas las columnas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    document_type TEXT,
    document_number TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Agregar columnas faltantes de manera segura (ADD COLUMN IF NOT EXISTS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
-- Columna role que era la que faltaba
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- Habilitar RLS (no falla si ya está habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para profiles (siempre borrar antes de crear)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR ALL
    USING ( 
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

-- 4. Trigger para crear profile automáticamente en cada nuevo Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. Agregar user_id a la tabla bookings
-- ==========================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Habilitar RLS en bookings (no falla si ya está activo)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" 
    ON public.bookings FOR SELECT 
    USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" 
    ON public.bookings FOR ALL
    USING ( 
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

DROP POLICY IF EXISTS "Enable insert for all users" ON public.bookings;
CREATE POLICY "Enable insert for all users" 
    ON public.bookings FOR INSERT 
    WITH CHECK (true);

-- ==========================================
-- ✅ COMPLETADO - Setup del portal de cliente
-- ==========================================
