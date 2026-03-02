-- Crear el bucket 'tour-images' en Supabase Storage si no existe
-- Ejecuta esto en Lovable Cloud -> SQL Editor

-- 1. Crear el bucket público para imágenes de tours
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir que usuarios autenticados suban archivos al bucket
CREATE POLICY "Authenticated users can upload tour images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tour-images');

-- 3. Permitir que todos (público) puedan ver las imágenes
CREATE POLICY "Public can view tour images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tour-images');

-- 4. Permitir que usuarios autenticados actualicen sus imágenes
CREATE POLICY "Authenticated users can update tour images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tour-images');

-- 5. Permitir que usuarios autenticados eliminen imágenes
CREATE POLICY "Authenticated users can delete tour images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tour-images');
