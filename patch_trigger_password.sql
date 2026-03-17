-- ═══════════════════════════════════════════════════════════════════════════════
-- PATCH: Actualizar trigger para poner requires_password_change = true
-- en usuarios creados desde el flujo de reservas (con contraseña temporal)
--
-- INSTRUCCIONES: Ejecutar en Lovable Cloud SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════════

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
    role,
    requires_password_change
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'DNI'),
    COALESCE(NEW.raw_user_meta_data->>'document_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    true  -- Usuario nuevo siempre requiere cambio de contraseña
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    document_type = EXCLUDED.document_type,
    document_number = EXCLUDED.document_number,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ PATCH COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════════
