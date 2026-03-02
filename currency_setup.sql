-- ============================================
-- SISTEMA DE TIPO DE CAMBIO — Bluelake Iquitos
-- Ejecutar en Lovable Cloud → SQL Editor
-- ============================================

-- PASO 1: Crear tabla exchange_rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_pair TEXT NOT NULL UNIQUE DEFAULT 'PEN_USD',
  rate DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar tipo de cambio inicial (1 PEN = 0.2703 USD, equivale a 1 USD = 3.70 PEN)
INSERT INTO exchange_rates (currency_pair, rate)
VALUES ('PEN_USD', 0.2703)
ON CONFLICT (currency_pair) DO UPDATE SET rate = 0.2703, updated_at = now();

-- Habilitar RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Lectura pública (todos pueden ver el tipo de cambio)
CREATE POLICY "Public read exchange rates"
ON exchange_rates FOR SELECT TO public USING (true);

-- Solo usuarios autenticados (admins) pueden actualizar
CREATE POLICY "Authenticated update exchange rates"
ON exchange_rates FOR UPDATE TO authenticated USING (true);

-- PASO 2: Migrar precios de USD a PEN (multiplicar por 3.70)
UPDATE tours SET base_price = ROUND(base_price * 3.70, 2);
UPDATE tours SET child_price = ROUND(child_price * 3.70, 2) WHERE child_price IS NOT NULL;

-- PASO 3: Agregar campo payment_currency a bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'PEN';
