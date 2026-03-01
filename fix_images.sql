-- Script de ACTUALIZACIÓN de imágenes para Tours existentes
-- Ejecutar en Lovable Cloud -> SQL Editor
-- Reemplaza las URLs de imagen con versiones verificadas que cargan correctamente

UPDATE tours SET image_url = 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80' WHERE slug = 'isla-monos-lupuna';
UPDATE tours SET image_url = 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?auto=format&fit=crop&w=800&q=80' WHERE slug = 'crea-bosque-huayo';
UPDATE tours SET image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' WHERE slug = 'verano-amazonico-playa';
UPDATE tours SET image_url = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80' WHERE slug = 'aventura-flotante-santo-tomas';
UPDATE tours SET image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80' WHERE slug = 'full-day-muelle-24';
