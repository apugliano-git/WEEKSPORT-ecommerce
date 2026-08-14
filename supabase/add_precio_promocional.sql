-- ==========================================
-- MIGRACIÓN: Columna precio_promocional en productos
-- ==========================================
-- Agregar la columna opcional de precio de oferta al listado de productos.
-- NULL = sin oferta. Cuando tiene un valor, la tienda muestra el precio tachado
-- y el precio de oferta en rosa.

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_promocional NUMERIC(10, 2) DEFAULT NULL;

-- Asegurarse de que la columna sea legible de forma pública (no rompe RLS existente)
-- No hace falta una política nueva: la columna hereda la política SELECT de la tabla productos.
