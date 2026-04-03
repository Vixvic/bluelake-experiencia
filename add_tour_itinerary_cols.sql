-- Actualización de la tabla Tours para soportar Itinerarios y Características Adicionales
-- Ejecutar en el SQL Editor de Lovable / Supabase

ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS included_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS itinerary jsonb DEFAULT '[]'::jsonb;

-- Ejemplo de datos (vacíos inicialmente):
-- included_items: ["Movilidad 100% seguro", "Ticket de ingreso", "Agente de turismo", "Tirolesa"]
-- itinerary: [{"time": "09:00 AM", "activity": "Recojo del hotel"}]
