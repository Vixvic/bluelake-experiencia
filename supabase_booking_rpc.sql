-- =========================================================================================
-- FUNCIÓN RPC PARA RESERVAS: create_booking_transaction
-- Se encarga de garantizar que la creación del perfil y la reserva se hagan atómicamente.
-- Maneja usuarios recurrentes buscando su ID por correo si el frontend no pudo por choque de cuenta.
-- Ejecutar en el SQL Editor de Supabase / Lovable.
-- =========================================================================================

CREATE OR REPLACE FUNCTION create_booking_transaction(
    p_tour_id UUID,
    p_dates DATE[],
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
    p_user_id UUID -- Puede ser nulo si supabase.auth.signUp lanzó error de cuenta ya existente
)
RETURNS JSON AS $$
DECLARE
    v_actual_user_id UUID;
    v_booking_id UUID;
BEGIN
    -- 1. Determinar el user_id final
    IF p_user_id IS NOT NULL THEN
        v_actual_user_id := p_user_id;
    ELSE
        -- Buscar si el correo ya existe en auth.users (bypassa RLS porque es SECURITY DEFINER)
        SELECT id INTO v_actual_user_id FROM auth.users WHERE email = p_customer_email LIMIT 1;
    END IF;

    -- 2. Upsert del profile si logramos obtener un user_id
    IF v_actual_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, user_id, full_name, document_type, document_number, phone, role)
        VALUES (v_actual_user_id, v_actual_user_id, p_customer_name, p_document_type, p_document_number, p_customer_phone, 'client')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            document_type = EXCLUDED.document_type,
            document_number = EXCLUDED.document_number,
            phone = EXCLUDED.phone;
    END IF;

    -- 3. Inserción de la Reserva
    -- Es crucial que dates se maneje como un array de strings si tu schema usa VARCHAR[] o TEXT[]
    INSERT INTO public.bookings (
        tour_id, dates, adults, children, total_amount, 
        payment_mode, payment_method, card_fee, 
        customer_name, customer_email, customer_phone, 
        document_type, document_number, notes, status, user_id
    ) VALUES (
        p_tour_id, 
        (SELECT array_agg(d::text) FROM unnest(p_dates) AS d), -- Mapear date a text[]
        p_adults, p_children, p_total_amount,
        p_payment_mode, p_payment_method, 0,
        p_customer_name, p_customer_email, p_customer_phone,
        p_document_type, p_document_number, p_notes, 'pending', v_actual_user_id
    ) RETURNING id INTO v_booking_id;
    
    RETURN json_build_object(
        'success', true, 
        'booking_id', v_booking_id, 
        'user_id', v_actual_user_id,
        'is_recurring_customer', (v_actual_user_id IS NOT NULL AND p_user_id IS NULL)
    );
EXCEPTION WHEN OTHERS THEN
    -- Ante cualquier error de constraints o type, hacemos rollback (automático en funciones plpgsql)
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
