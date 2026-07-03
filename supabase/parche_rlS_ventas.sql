-- Activar el control perimetral (Row Level Security)
ALTER TABLE public.ventas_historico ENABLE ROW LEVEL SECURITY;

-- Eliminar la política en caso de que ya exista (para permitir re-ejecución)
DROP POLICY IF EXISTS "Permitir inserción y lectura solo a administradores autenticados" ON public.ventas_historico;

-- Crear la política restrictiva
-- Restringe el acceso de las operaciones (como SELECT e INSERT) exclusivamente al rol 'authenticated'.
-- Por defecto, al activar RLS, el rol público ('anon') queda completamente denegado.
CREATE POLICY "Permitir inserción y lectura solo a administradores autenticados"
ON public.ventas_historico
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
