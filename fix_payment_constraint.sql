-- SQL Script para arreglar el constraint de métodos de pago en Supabase

-- 1. Intentar eliminar el constraint actual de payment_method en la tabla bookings
-- (Nota: el nombre del constraint puede variar si fue autogenerado, usaremos el típico que aparece en errores: "bookings_payment_method_check")
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

-- 2. Añadir el nuevo constraint permitiendo los valores separados
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IN ('transfer', 'yape', 'plin', 'card', 'cash'));
-- (Nota: agrego 'cash' porque suele ser útil para reservas manuales, si no lo necesitas, se puede obviar, pero al menos los 4 primeros sí son requeridos).

-- UPDATE: Modificamos las reservas antiguas que dependían de yape_plin para convertirlas en yape como fallback (opcional, ayuda a normalizar la data)
UPDATE public.bookings 
SET payment_method = 'yape' 
WHERE payment_method = 'yape_plin';
