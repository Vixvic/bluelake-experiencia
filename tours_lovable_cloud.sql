-- Script de Inserción para Tours Corporativos Oficiales de Bluelake
-- Instrucciones:
-- 1. Ve a Lovable Cloud -> SQL Editor
-- 2. Copia todo este código y pégalo allí
-- 3. Haz click en "Run" o "Ejecutar"

-- NOTA: Este script primero intenta eliminar tours con el mismo slug para evitar duplicados si lo corres múltiples veces.
DELETE FROM tours WHERE slug IN (
  'isla-monos-lupuna', 
  'crea-bosque-huayo', 
  'verano-amazonico-playa', 
  'aventura-flotante-santo-tomas', 
  'full-day-muelle-24'
);

INSERT INTO tours (
  title_es, 
  title_en, 
  description_es, 
  description_en, 
  category, 
  season, 
  base_price, 
  child_price, 
  max_capacity, 
  current_bookings, 
  premium, 
  requires_quote, 
  visible, 
  slug, 
  image_url
) VALUES 
-- 1. Isla de los Monos & Árbol Lupuna
(
  'Isla de los Monos & Árbol Lupuna', 
  'Monkey Island & Lupuna Tree', 
  'Un recorrido que combina fauna, cultura y el imponente árbol Lupuna.', 
  'A tour that combines fauna, culture, and the imposing Lupuna tree.', 
  'full-days', 
  'all', 
  150, 
  80, 
  20, 
  0, 
  false, 
  false, 
  true, 
  'isla-monos-lupuna', 
  'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=800'
),

-- 2. CREA & Bosque de Huayo
(
  'CREA & Bosque de Huayo', 
  'CREA & Huayo Forest', 
  'Conservación de fauna amazónica y senderos naturales.', 
  'Conservation of Amazonian fauna and natural trails.', 
  'full-days', 
  'all', 
  120, 
  60, 
  20, 
  0, 
  false, 
  false, 
  true, 
  'crea-bosque-huayo', 
  'https://images.unsplash.com/photo-1518182170546-0766de6b6aad?w=800'
),

-- 3. Verano Amazónico – Playa Río Nanay
(
  'Verano Amazónico – Playa', 
  'Amazon Summer - Beach', 
  'Playas de arena blanca, actividades recreativas y ski acuático/motos.', 
  'White sand beaches, recreational activities, and water skiing/jet skis.', 
  'actividades-acuaticas', 
  'summer', 
  180, 
  90, 
  15, 
  0, 
  false, 
  false, 
  true, 
  'verano-amazonico-playa', 
  'https://images.unsplash.com/photo-1544473244-f6895e69da8e?w=800'
),

-- 4. Aventura Flotante – Laguna Santo Tomás
(
  'Aventura Flotante – Laguna Santo Tomás', 
  'Floating Adventure - Santo Tomas Lagoon', 
  'Balsas flotantes, kayak, paddle y ski acuático en la laguna.', 
  'Floating rafts, kayaks, paddleboards, and water skiing in the lagoon.', 
  'balsas-turisticas', 
  'winter', 
  160, 
  80, 
  25, 
  0, 
  false, 
  false, 
  true, 
  'aventura-flotante-santo-tomas', 
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
),

-- 5. Full Day Muelle 24 – Experiencia Premium
(
  'Full Day Muelle 24', 
  'Pier 24 Full Day', 
  'Un espacio privado en Santo Tomás con deportes acuáticos, relax y gastronomía amazónica.', 
  'A private space in Santo Tomás with water sports, relaxation, and Amazonian gastronomy.', 
  'muelle-24', 
  'all', 
  350, 
  150, 
  10, 
  0, 
  true, 
  false, 
  true, 
  'full-day-muelle-24', 
  'https://images.unsplash.com/photo-1626447857058-2ba6a8882dfe?w=800'
);
