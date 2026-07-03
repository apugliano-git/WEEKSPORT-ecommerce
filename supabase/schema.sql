-- ============================================================
-- WEEKSPORT - Esquema de Base de Datos (Supabase / PostgreSQL)
-- Aplicar en: Supabase Dashboard > SQL Editor
-- Versión: 1.1 (Fase 1 - MVP Consolidado)
-- ============================================================

-- ============================================================
-- 1. TABLA: categorias
-- Almacena las agrupaciones principales de las prendas.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)    NOT NULL,
  slug        VARCHAR(100)    UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por slug (filtros de URL)
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias(slug);

-- ============================================================
-- 2. TABLA: productos
-- Instancia principal que define el modelo de la indumentaria.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.productos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(255)    NOT NULL,
  descripcion   TEXT,
  categoria_id  UUID            NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  imagenes      TEXT[]          NOT NULL DEFAULT '{}',  -- Array de URLs del Supabase Storage
  activo        BOOLEAN         NOT NULL DEFAULT true,  -- Soft delete: false = oculto del catálogo
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Índices para optimizar cruces y filtros
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo       ON public.productos (activo);

-- ============================================================
-- 3. TABLA: variantes_stock
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
-- 4. ROW LEVEL SECURITY (RLS) - TABLAS DE NEGOCIO
-- LECTURA pública: cualquier visitante puede ver el catálogo.
-- ESCRITURA: solo usuarios autenticados (administradoras con JWT).
-- ============================================================

ALTER TABLE public.categorias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_stock  ENABLE ROW LEVEL SECURITY;

-- --- Políticas para `categorias` ---
CREATE POLICY "Lectura publica de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden modificar categorias" ON public.categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Políticas para `productos` ---
CREATE POLICY "Lectura publica de productos activos" ON public.productos FOR SELECT USING (activo = true);
CREATE POLICY "Solo admins pueden modificar productos" ON public.productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Políticas para `variantes_stock` ---
CREATE POLICY "Lectura publica de variantes" ON public.variantes_stock FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.productos p WHERE p.id = producto_id AND p.activo = true)
);
CREATE POLICY "Solo admins pueden modificar variantes" ON public.variantes_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) - STORAGE BUCKET
-- Políticas explícitas para el bucket 'productos-imagenes'.
-- Nota: Asegurarse de haber creado el bucket público en el dashboard.
-- ============================================================

CREATE POLICY "Administradoras pueden subir imágenes de productos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos-imagenes');

CREATE POLICY "Administradoras pueden actualizar imágenes de productos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos-imagenes');

CREATE POLICY "Administradoras pueden eliminar imágenes de productos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos-imagenes');


-- ============================================================
-- 6. DATOS INICIALES (MOCK DATA)
-- Inserción de categorías base y productos de prueba
-- ============================================================

-- Insertar las categorías reales del negocio
INSERT INTO public.categorias (nombre, slug) VALUES
  ('Remeras', 'remeras'),
  ('Tops', 'tops'),
  ('Buzos y Camperas', 'buzos-y-camperas'),
  ('Calzas', 'calzas'),
  ('Shorts y Bermudas', 'shorts-y-bermudas'),
  ('Joggins', 'joggins'),
  ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO NOTHING;

-- Insertar Productos (utilizando subqueries para obtener los categoria_id dinámicamente)
WITH ins_productos AS (
  INSERT INTO public.productos (nombre, descripcion, categoria_id, imagenes, activo)
  VALUES 
    (
      'Calza Deportiva Pro Flex', 
      'Calza larga de lycra premium con cintura alta y costuras reforzadas. Ideal para entrenamientos de alta intensidad.', 
      (SELECT id FROM public.categorias WHERE slug = 'calzas'), 
      ARRAY['https://placehold.co/600x800/16213e/ffffff?text=Calza+Negra+1', 'https://placehold.co/600x800/16213e/ffffff?text=Calza+Negra+2'], 
      true
    ),
    (
      'Remera Dry-Fit Aero', 
      'Remera manga corta confeccionada con tejido tecnológico respirable que mantiene la piel seca.', 
      (SELECT id FROM public.categorias WHERE slug = 'remeras'), 
      ARRAY['https://placehold.co/600x800/0f3460/ffffff?text=Remera+Blanca'], 
      true
    ),
    (
      'Top Deportivo Support', 
      'Top con soporte medio, espalda deportiva cruzada y tazas desmontables.', 
      (SELECT id FROM public.categorias WHERE slug = 'tops'), 
      ARRAY['https://placehold.co/600x800/e94560/ffffff?text=Top+Gris'], 
      true
    )
  RETURNING id, nombre
)
-- Insertar Variantes asociadas
INSERT INTO public.variantes_stock (producto_id, talle, color, cantidad, precio)
VALUES
  -- Variantes para la Calza Pro Flex
  ((SELECT id FROM ins_productos WHERE nombre = 'Calza Deportiva Pro Flex'), 'S', 'Negro', 12, 18500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Calza Deportiva Pro Flex'), 'M', 'Negro', 15, 18500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Calza Deportiva Pro Flex'), 'L', 'Negro', 8, 18500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Calza Deportiva Pro Flex'), 'XL', 'Negro', 5, 19800.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Calza Deportiva Pro Flex'), 'M', 'Azul Marino', 10, 18500.00),

  -- Variantes para la Remera Dry-Fit
  ((SELECT id FROM ins_productos WHERE nombre = 'Remera Dry-Fit Aero'), 'S', 'Blanco', 20, 12500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Remera Dry-Fit Aero'), 'M', 'Blanco', 25, 12500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Remera Dry-Fit Aero'), 'L', 'Blanco', 15, 12500.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Remera Dry-Fit Aero'), 'M', 'Negro', 18, 12500.00),

  -- Variantes para el Top Support
  ((SELECT id FROM ins_productos WHERE nombre = 'Top Deportivo Support'), 'S', 'Gris Melange', 10, 9900.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Top Deportivo Support'), 'M', 'Gris Melange', 12, 9900.00),
  ((SELECT id FROM ins_productos WHERE nombre = 'Top Deportivo Support'), 'L', 'Gris Melange', 6, 9900.00);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
