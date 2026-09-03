-- Las ofertas existentes siguen siendo descuentos con precio anterior.
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS promocion_sin_precio_anterior boolean NOT NULL DEFAULT false;
