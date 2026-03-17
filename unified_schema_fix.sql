-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT SQL UNIFICADO DEFINITIVO — Bluelake Experiencia
-- Fecha: 2026-03-17
--
-- Este script normaliza TODA la lógica de BD para que el flujo de reservas
-- y creación de usuarios funcione correctamente.
--
-- INSTRUCCIONES: Copiar TODO este archivo y ejecutarlo en el SQL Editor de
-- Lovable Cloud. Ejecutar UNA sola vez.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ASEGURAR COLUMNAS EN PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ASEGURAR COLUMNAS EN BOOKINGS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS document_number TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGER HANDLE_NEW_USER — Versión definitiva
-- Se activa automáticamente cuando supabase.auth.signUp() crea un usuario.
-- Inserta en profiles con TODOS los campos necesarios.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    document_type,
    document_number,
    phone,
    role
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'DNI'),
    COALESCE(NEW.raw_user_meta_data->>'document_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    document_type = EXCLUDED.document_type,
    document_number = EXCLUDED.document_number,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

-- Asegurar que el trigger existe y apunta a nuestra función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ELIMINAR FUNCIONES RPC DUPLICADAS (versiones viejas con DATE[])
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.create_booking_transaction(
    uuid, date[], integer, integer, numeric, text, text, text, text, text, text, text, text, uuid
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC CREATE_BOOKING_TRANSACTION — Versión definitiva con TEXT[]
-- Acepta fechas como strings ("2026-04-01") y las castea internamente a DATE.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_booking_transaction(
    p_tour_id UUID,
    p_dates TEXT[],
    p_adults INTEGER,
    p_children INTEGER,
    p_total_amount NUMERIC,
    p_payment_mode TEXT,
    p_payment_method TEXT,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_document_type TEXT,
    p_document_number TEXT,
    p_notes TEXT,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_actual_user_id UUID;
    v_booking_id UUID;
    v_is_new BOOLEAN := FALSE;
    v_dates DATE[];
BEGIN
    -- Convertir array de texto a array de fechas
    SELECT array_agg(d::DATE) INTO v_dates FROM unnest(p_dates) AS d;

    -- 1. Determinar el user_id final
    IF p_user_id IS NOT NULL THEN
        v_actual_user_id := p_user_id;
        v_is_new := TRUE;
    ELSE
        -- Buscar si el correo ya existe en auth.users
        SELECT id INTO v_actual_user_id
        FROM auth.users
        WHERE email = p_customer_email
        LIMIT 1;
    END IF;

    -- 2. Upsert del profile si tenemos un user_id
    IF v_actual_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id, user_id, full_name, document_type, document_number, phone, role, requires_password_change
        )
        VALUES (
            v_actual_user_id, v_actual_user_id, p_customer_name,
            p_document_type, p_document_number, p_customer_phone,
            'client', v_is_new
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            document_type = EXCLUDED.document_type,
            document_number = EXCLUDED.document_number,
            phone = EXCLUDED.phone;
    END IF;

    -- 3. Insertar la reserva
    INSERT INTO public.bookings (
        tour_id, dates, adults, children, total_amount,
        payment_mode, payment_method, card_fee,
        customer_name, customer_email, customer_phone,
        document_type, document_number, notes, status, user_id
    ) VALUES (
        p_tour_id,
        v_dates,
        p_adults, p_children, p_total_amount,
        p_payment_mode, p_payment_method, 0,
        p_customer_name, p_customer_email, p_customer_phone,
        p_document_type, p_document_number, p_notes,
        'pending', v_actual_user_id
    ) RETURNING id INTO v_booking_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'user_id', v_actual_user_id,
        'is_recurring_customer', (v_is_new = FALSE)
    );
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════════
