-- WEEKSPORT security and integrity hardening.
-- This migration is intentionally fail-fast: invalid existing data must be
-- repaired and reviewed before applying it, never silently changed here.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.variantes_stock WHERE cantidad < 0) THEN
        RAISE EXCEPTION 'Preflight failed: variantes_stock contains negative cantidad';
    END IF;
    IF EXISTS (SELECT 1 FROM public.variantes_stock WHERE precio < 0) THEN
        RAISE EXCEPTION 'Preflight failed: variantes_stock contains negative precio';
    END IF;
    IF EXISTS (SELECT 1 FROM public.variantes_stock WHERE costo < 0) THEN
        RAISE EXCEPTION 'Preflight failed: variantes_stock contains negative costo';
    END IF;
    IF EXISTS (SELECT 1 FROM public.productos WHERE precio_promocional < 0) THEN
        RAISE EXCEPTION 'Preflight failed: productos contains negative precio_promocional';
    END IF;
    IF EXISTS (SELECT 1 FROM public.configuracion_sitio WHERE id <> 1) THEN
        RAISE EXCEPTION 'Preflight failed: configuracion_sitio is not a singleton with id 1';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.ventas_historico
        WHERE jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) = 0
    ) THEN
        RAISE EXCEPTION 'Preflight failed: ventas_historico contains a non-array or empty items value';
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

ALTER TABLE public.variantes_stock
    ADD CONSTRAINT variantes_stock_cantidad_nonnegative CHECK (cantidad >= 0),
    ADD CONSTRAINT variantes_stock_precio_nonnegative CHECK (precio >= 0),
    ADD CONSTRAINT variantes_stock_costo_nonnegative CHECK (costo IS NULL OR costo >= 0);

ALTER TABLE public.productos
    ADD CONSTRAINT productos_precio_promocional_nonnegative
    CHECK (precio_promocional IS NULL OR precio_promocional >= 0);

ALTER TABLE public.configuracion_sitio
    ADD CONSTRAINT configuracion_sitio_singleton CHECK (id = 1);

ALTER TABLE public.ventas_historico
    ADD CONSTRAINT ventas_historico_items_nonempty_array
    CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0);

DROP INDEX IF EXISTS public.idx_categorias_slug;

DO $$
DECLARE
    policy_row record;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'categorias', 'configuracion_sitio', 'productos',
              'talles_por_tipo', 'variantes_stock', 'ventas_historico'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            policy_row.policyname, policy_row.schemaname, policy_row.tablename
        );
    END LOOP;
END
$$;

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talles_por_tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY categorias_public_read
ON public.categorias FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY categorias_admin_write
ON public.categorias FOR ALL TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY configuracion_public_read
ON public.configuracion_sitio FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY configuracion_admin_update
ON public.configuracion_sitio FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY productos_public_active_read
ON public.productos FOR SELECT TO anon, authenticated
USING (activo = true);

CREATE POLICY productos_admin_read
ON public.productos FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY productos_admin_insert
ON public.productos FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY productos_admin_update
ON public.productos FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY productos_admin_delete
ON public.productos FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY talles_public_read
ON public.talles_por_tipo FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY variantes_public_visible_read
ON public.variantes_stock FOR SELECT TO anon, authenticated
USING (
    visible_en_catalogo = true
    AND EXISTS (
        SELECT 1
        FROM public.productos AS p
        WHERE p.id = variantes_stock.producto_id
          AND p.activo = true
    )
);

CREATE POLICY variantes_admin_read
ON public.variantes_stock FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY variantes_admin_insert
ON public.variantes_stock FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY variantes_admin_update
ON public.variantes_stock FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY variantes_admin_delete
ON public.variantes_stock FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY ventas_admin_read
ON public.ventas_historico FOR SELECT TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY ventas_admin_insert
ON public.ventas_historico FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

DROP FUNCTION IF EXISTS public.crear_producto_con_variantes(varchar, text, uuid, varchar, varchar, numeric, text[], text[]);

CREATE OR REPLACE FUNCTION public.crear_producto_con_variantes(
    p_nombre character varying,
    p_descripcion text,
    p_categoria_id uuid,
    p_genero character varying,
    p_tipo_talle character varying,
    p_precio_inicial numeric,
    p_imagenes text[] DEFAULT ARRAY[]::text[],
    p_colores text[] DEFAULT ARRAY[]::text[],
    p_cantidades jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_producto_id uuid;
    v_tipo_talle public.tipo_talle;
    v_genero public.genero_producto;
    v_colores text[];
    v_cantidades jsonb := COALESCE(p_cantidades, '{}'::jsonb);
BEGIN
    IF NOT (SELECT public.is_admin()) THEN
        RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
    END IF;
    IF p_nombre IS NULL OR btrim(p_nombre) = '' THEN
        RAISE EXCEPTION 'El nombre del producto es obligatorio' USING ERRCODE = '22023';
    END IF;
    IF p_categoria_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.categorias WHERE id = p_categoria_id
    ) THEN
        RAISE EXCEPTION 'La categoría no existe' USING ERRCODE = '23503';
    END IF;
    IF p_precio_inicial IS NULL OR p_precio_inicial < 0 THEN
        RAISE EXCEPTION 'El precio inicial no puede ser negativo' USING ERRCODE = '23514';
    END IF;
    v_genero := p_genero::public.genero_producto;
    v_tipo_talle := p_tipo_talle::public.tipo_talle;
    IF NOT EXISTS (
        SELECT 1 FROM public.talles_por_tipo WHERE tipo_talle = v_tipo_talle
    ) THEN
        RAISE EXCEPTION 'No hay talles configurados para el tipo seleccionado' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_cantidades) <> 'object' THEN
        RAISE EXCEPTION 'Las cantidades deben ser un objeto JSON' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_each_text(v_cantidades) AS quantity(size_name, value)
        WHERE value !~ '^[0-9]+$'
           OR CASE WHEN value ~ '^[0-9]+$' THEN value::numeric > 2147483647 ELSE false END
    ) THEN
        RAISE EXCEPTION 'Las cantidades deben ser enteros no negativos' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_object_keys(v_cantidades) AS requested(size_name)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.talles_por_tipo
            WHERE tipo_talle = v_tipo_talle AND talle = requested.size_name
        )
    ) THEN
        RAISE EXCEPTION 'La cantidad referencia un talle no configurado' USING ERRCODE = '22023';
    END IF;
    IF p_colores IS NULL OR cardinality(p_colores) = 0 THEN
        v_colores := ARRAY['Sin color'];
    ELSE
        IF EXISTS (
            SELECT 1 FROM unnest(p_colores) AS color(value)
            WHERE value IS NULL OR btrim(value) = ''
        ) THEN
            RAISE EXCEPTION 'Los colores no pueden estar vacíos' USING ERRCODE = '22023';
        END IF;
        IF EXISTS (
            SELECT lower(btrim(value))
            FROM unnest(p_colores) AS color(value)
            GROUP BY lower(btrim(value))
            HAVING count(*) > 1
        ) THEN
            RAISE EXCEPTION 'No se permiten colores duplicados' USING ERRCODE = '23505';
        END IF;
        SELECT array_agg(btrim(value) ORDER BY ordinality)
        INTO v_colores
        FROM unnest(p_colores) WITH ORDINALITY AS color(value, ordinality);
    END IF;

    INSERT INTO public.productos (nombre, descripcion, categoria_id, genero, tipo_talle, imagenes, activo)
    VALUES (btrim(p_nombre), p_descripcion, p_categoria_id, v_genero, v_tipo_talle, COALESCE(p_imagenes, ARRAY[]::text[]), true)
    RETURNING id INTO v_producto_id;

    INSERT INTO public.variantes_stock (producto_id, talle, color, cantidad, precio)
    SELECT v_producto_id, size.talle, color.value,
           COALESCE((v_cantidades ->> size.talle)::integer, 0), p_precio_inicial
    FROM public.talles_por_tipo AS size
    CROSS JOIN unnest(v_colores) AS color(value)
    WHERE size.tipo_talle = v_tipo_talle
    ORDER BY size.orden;

    RETURN json_build_object('status', 'success', 'producto_id', v_producto_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crear_producto_con_variantes(varchar, text, uuid, varchar, varchar, numeric, text[], text[], jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agregar_color_a_producto(uuid, text, numeric, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.actualizar_precio_color(uuid, text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.actualizar_precio_producto(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.procesar_venta(jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.crear_producto_con_variantes(varchar, text, uuid, varchar, varchar, numeric, text[], text[], jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agregar_color_a_producto(uuid, text, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_precio_color(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_precio_producto(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_venta(jsonb) TO authenticated;
