-- ==========================================================================================
-- PASO FINAL: Eliminar la función RPC duplicada con el tipo DATE[] (la versión antigua)
-- Hay dos versiones de create_booking_transaction: una con DATE[] y otra con TEXT[].
-- Postgres no puede elegir entre ellas cuando el cliente envía texto. Eliminamos la vieja.
-- ==========================================================================================

-- Eliminar SOLO la versión antigua que acepta DATE[]
DROP FUNCTION IF EXISTS public.create_booking_transaction(
    uuid,       -- p_tour_id
    date[],     -- p_dates (VERSION ANTIGUA - ELIMINAR ESTA)
    integer,
    integer,
    numeric,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    uuid
);
