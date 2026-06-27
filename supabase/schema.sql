-- ============================================================
-- WEEKSPORT - Esquema de Base de Datos (Supabase / PostgreSQL)
-- Aplicar en: Supabase Dashboard > SQL Editor
-- Versión: 1.0 (Fase 1 - MVP)
-- ============================================================

-- ============================================================
-- TABLA: productos
-- Instancia principal que define el modelo de la indumentaria.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(255)    NOT NULL,
  descripcion TEXT,
  categoria   VARCHAR(100)    NOT NULL,
  imagenes    TEXT[]          NOT NULL DEFAULT '{}',  -- Array de URLs del Supabase Storage
  activo      BOOLEAN         NOT NULL DEFAULT true,  -- Soft delete: false = oculto del catálogo
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índice para filtrar rápido por categoría y estado
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo    ON public.productos (activo);

-- ============================================================
-- TABLA: variantes_stock
-- Stock por talle y color. Cardinalidad 1:N respecto a productos.
-- El precio vive aquí para permitir ajustes por variante (ej. talles grandes).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.variantes_stock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID            NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  talle       VARCHAR(20)     NOT NULL,  -- 'XS', 'S', 'M', 'L', 'XL', 'XXL'
  color       VARCHAR(100)    NOT NULL,
  cantidad    INTEGER         NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  precio      NUMERIC(10, 2)  NOT NULL CHECK (precio >= 0)  -- Precio específico de esta variante
);

-- Índice para buscar rápido las variantes de un producto
CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON public.variantes_stock (producto_id);

-- Restricción única: no puede haber dos variantes con el mismo talle+color para el mismo producto
ALTER TABLE public.variantes_stock
  ADD CONSTRAINT uq_variante_producto_talle_color UNIQUE (producto_id, talle, color);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- LECTURA pública: cualquier visitante puede ver el catálogo.
-- ESCRITURA: solo usuarios autenticados (administradoras con JWT).
-- ============================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE public.productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_stock  ENABLE ROW LEVEL SECURITY;

-- --- Políticas para `productos` ---

-- Lectura pública: solo productos activos (oculta los de baja temporal)
CREATE POLICY "Lectura publica de productos activos"
  ON public.productos
  FOR SELECT
  USING (activo = true);

-- Escritura solo para admins autenticadas
CREATE POLICY "Solo admins pueden insertar productos"
  ON public.productos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden actualizar productos"
  ON public.productos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden eliminar productos"
  ON public.productos FOR DELETE
  TO authenticated
  USING (true);

-- --- Políticas para `variantes_stock` ---

-- Lectura pública: variantes de productos activos
CREATE POLICY "Lectura publica de variantes"
  ON public.variantes_stock
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_id AND p.activo = true
    )
  );

-- Escritura solo para admins autenticadas
CREATE POLICY "Solo admins pueden insertar variantes"
  ON public.variantes_stock FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden actualizar variantes"
  ON public.variantes_stock FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden eliminar variantes"
  ON public.variantes_stock FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- STORAGE (Referencia de configuración - aplicar en Dashboard)
-- ============================================================
-- Crear un bucket llamado "productos-imagenes" con acceso PÚBLICO.
-- Path sugerido para las imágenes: productos-imagenes/{producto_id}/{nombre_archivo}
-- La URL pública resultante tiene el formato:
-- https://<proyecto>.supabase.co/storage/v1/object/public/productos-imagenes/...

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
