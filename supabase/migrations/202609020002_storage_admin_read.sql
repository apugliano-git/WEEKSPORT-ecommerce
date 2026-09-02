BEGIN;

DROP POLICY IF EXISTS productos_imagenes_public_read ON storage.objects;
DROP POLICY IF EXISTS productos_imagenes_admin_read ON storage.objects;

CREATE POLICY productos_imagenes_admin_read
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'productos-imagenes' AND (SELECT public.is_admin()));

COMMIT;
