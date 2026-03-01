
-- Corregir políticas demasiado permisivas
-- Las reservas y solicitudes corporativas pueden hacerse sin login, pero limitamos los campos

-- Reemplazar la política de insert en bookings para ser más restrictiva
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;
CREATE POLICY "Anyone can create booking" ON public.bookings 
FOR INSERT WITH CHECK (
  customer_email IS NOT NULL AND 
  customer_name IS NOT NULL AND 
  tour_id IS NOT NULL AND 
  array_length(dates, 1) > 0
);

-- Reemplazar la política de insert en corporate_requests
DROP POLICY IF EXISTS "Anyone can submit corporate request" ON public.corporate_requests;
CREATE POLICY "Anyone can submit corporate request" ON public.corporate_requests 
FOR INSERT WITH CHECK (
  company_name IS NOT NULL AND 
  contact_person IS NOT NULL AND 
  email IS NOT NULL
);
