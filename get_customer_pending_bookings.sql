-- ═══════════════════════════════════════════════════════════════════════
-- RPC: get_customer_pending_bookings
-- Consulta las reservas pendientes/confirmadas con fechas futuras de un cliente
-- ═══════════════════════════════════════════════════════════════════════
-- EJECUTAR EN: Lovable Cloud → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_customer_pending_bookings(p_email TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(b))
    FROM (
      SELECT 
        b.id, b.dates, b.adults, b.children, 
        b.total_amount, b.payment_method, b.payment_mode, b.status,
        t.title_es, t.title_en, t.category
      FROM public.bookings b
      JOIN public.tours t ON t.id = b.tour_id
      WHERE b.customer_email = p_email
        AND b.status IN ('pending', 'confirmed')
        AND EXISTS (
          SELECT 1 FROM unnest(b.dates) AS d 
          WHERE d::date >= CURRENT_DATE
        )
      ORDER BY b.created_at DESC
    ) b
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
