-- =========================================================================================
-- REPARACIÓN DEL TRIGGER DE CREACIÓN DE USUARIOS (ERROR 500: Violates not-null constraint)
-- Ejecutar este script en el SQL Editor de Lovable para arreglar el registro de nuevos usuarios.
-- =========================================================================================

-- 1. Actualizamos la función que se ejecuta automáticamente cuando alguien se registra (SignUp)
-- El error 500 ocurría porque la función original intentaba insertar en `profiles` sin incluir
-- las columnas requeridas NOT NULL que agregamos recientemente (user_id o document_number).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id, -- Faltaba explícitamente insertar user_id en el trigger original de Lovable
    full_name,
    document_type,
    document_number,
    phone,
    role
  )
  VALUES (
    NEW.id,
    NEW.id, -- user_id es igual al ID de autenticación
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'document_type', 'DNI'),
    COALESCE(NEW.raw_user_meta_data->>'document_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$;

-- Nota: El trigger original 'on_auth_user_created' ya está vinculado a esta función
-- por lo que solo con reemplazar la función arriba el sistema volverá a la vida.
