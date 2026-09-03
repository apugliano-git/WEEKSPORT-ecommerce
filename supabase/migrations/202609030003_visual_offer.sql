BEGIN;

ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS en_oferta boolean NOT NULL DEFAULT false;

-- Oferta sólo destaca el producto: nunca reemplaza el precio de sus variantes.
ALTER TABLE public.productos
DROP CONSTRAINT IF EXISTS productos_oferta_sin_precio_promocional;
ALTER TABLE public.productos
ADD CONSTRAINT productos_oferta_sin_precio_promocional
CHECK (NOT en_oferta OR precio_promocional IS NULL);

COMMIT;
