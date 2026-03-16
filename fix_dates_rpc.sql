-- ==========================================================================================
-- CORRECCIÓN DEFINITIVA: Error de tipo date[] vs text[] en create_booking_transaction
-- El frontend envía fechas como strings ISO (ej: "2026-04-01"), pero la RPC las declaraba
-- como DATE[], lo que causaba un mismatch de tipos. Esta versión acepta TEXT[] de entrada
-- y castea correctamente a DATE antes de insertar.
-- 
-- Ejecutar en el SQL Editor de Lovable Cloud
-- ==========================================================================================

CREATE OR REPLACE FUNCTION create_booking_transaction(
    p_tour_id UUID,
    p_dates TEXT[],          -- Recibimos strings como "2026-04-01" desde el frontend
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
    -- Convertir el array de texto a array de fechas
    SELECT array_agg(d::DATE) INTO v_dates FROM unnest(p_dates) AS d;

    -- 1. Determinar el user_id final
    IF p_user_id IS NOT NULL THEN
        v_actual_user_id := p_user_id;
        v_is_new := TRUE;
    ELSE
        -- Buscar si el correo ya existe en auth.users (bypassa RLS porque es SECURITY DEFINER)
        SELECT id INTO v_actual_user_id FROM auth.users WHERE email = p_customer_email LIMIT 1;
    END IF;

    -- 2. Upsert del profile si logramos obtener un user_id
    IF v_actual_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id, user_id, full_name, document_type, document_number, phone, role, requires_password_change
        )
        VALUES (
            v_actual_user_id, v_actual_user_id, p_customer_name, p_document_type, p_document_number, p_customer_phone, 'client', v_is_new
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            document_type = EXCLUDED.document_type,
            document_number = EXCLUDED.document_number,
            phone = EXCLUDED.phone;
    END IF;

    -- 3. Inserción de la Reserva con las fechas correctamente casteadas a DATE
    INSERT INTO public.bookings (
        tour_id, dates, adults, children, total_amount,
        payment_mode, payment_method, card_fee,
        customer_name, customer_email, customer_phone,
        document_type, document_number, notes, status, user_id
    ) VALUES (
        p_tour_id,
        v_dates,           -- DATE[] correctamente casteado
        p_adults, p_children, p_total_amount,
        p_payment_mode, p_payment_method, 0,
        p_customer_name, p_customer_email, p_customer_phone,
        p_document_type, p_document_number, p_notes, 'pending', v_actual_user_id
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
