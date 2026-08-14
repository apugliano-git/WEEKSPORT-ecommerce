-- ==========================================
-- FIX: Permisos de Seguridad para procesar_venta
-- ==========================================
-- El cliente web usa la Anon Key para hacer las peticiones, pero las tablas (ventas y variantes_stock)
-- tienen políticas RLS (Row Level Security) que solo permiten a 'authenticated' modificarlas.
--
-- Al establecer SECURITY DEFINER, le decimos a Postgres que esta función se debe
-- ejecutar con los mismos privilegios de quien la creó (el admin/postgres), saltándose
-- el límite de RLS del usuario anónimo. Esto es la práctica estándar para transacciones seguras.

ALTER FUNCTION public.procesar_venta(items_payload JSONB) SECURITY DEFINER;
