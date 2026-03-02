-- ==============================================
-- LIMPIAR CATEGORIAS Y ELIMINAR DUPLICADOS
-- ==============================================
-- Este script reorganiza las categorías de tours
-- y elimina entradas duplicadas para una experiencia
-- más clara y ordenada para el usuario.
-- ==============================================

-- Paso 1: Actualizar categorías a un esquema limpio
-- Categorías finales:
--   full-days       → "Tours Full Day"
--   acuaticas       → "Deportes Acuáticos"  
--   naturaleza      → "Naturaleza y Cultura"
--   premium         → "Experiencias Premium"

-- Tours Full Day: mantener como están
-- (Isla de los Monos, CREA & Bosque de Huayo ya son full-days)

-- Balsas turísticas → mover a "naturaleza" (son tours de naturaleza realmente)
UPDATE tours SET category = 'naturaleza' WHERE category = 'balsas-turisticas';

-- Aventura → mover a "acuaticas" (motos acuáticas, pesca)
UPDATE tours SET category = 'acuaticas' WHERE category = 'aventura';

-- Actividades acuáticas → renombrar a "acuaticas"
UPDATE tours SET category = 'acuaticas' WHERE category = 'actividades-acuaticas';

-- Paso 2: Eliminar tours duplicados
-- Eliminar el CREA y Bosque de Huayo que estaba en naturaleza (mantener el de full-days)
DELETE FROM tours WHERE slug = 'crea-huayo-forest' AND category = 'naturaleza';

-- Si hay más duplicados por nombre similar, eliminarlos
-- (verificar manualmente antes de ejecutar)

-- Paso 3: Verificar resultado
SELECT title_es, slug, category, season, base_price FROM tours ORDER BY category, title_es;
