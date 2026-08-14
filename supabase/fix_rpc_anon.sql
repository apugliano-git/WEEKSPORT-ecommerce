-- ==========================================
-- FIX 2: Permisos de Ejecución (GRANT EXECUTE) para procesar_venta
-- ==========================================
-- Como la aplicación actualmente no requiere que el usuario haga "Login" oficial para usar
-- el panel (es un sistema abierto local), el cliente de Supabase se conecta con la Anon Key (rol 'anon').
--
-- En configuraciones de seguridad estrictas previas, le habíamos quitado el acceso al rol 'anon'
-- para ejecutar esta función, por lo que Postgres bloqueaba la llamada antes de empezar.
--
-- Estos comandos le devuelven el permiso al rol 'anon' para poder llamar al RPC desde la web.

GRANT EXECUTE ON FUNCTION public.procesar_venta(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.procesar_venta(jsonb) TO public;
