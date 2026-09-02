--
-- Tipos ENUM
--
CREATE TYPE public.genero_producto AS ENUM (
    'Hombre',
    'Mujer',
    'Unisex',
    'Niños'
);

CREATE TYPE public.tipo_talle AS ENUM (
    'unico',
    'sin_talle',
    'tops',
    'estandar',
    'ninos',
    'colegial'
);

--
-- Tablas
--

CREATE TABLE public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying NOT NULL,
    slug character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    imagen_url text
);

CREATE TABLE public.configuracion_sitio (
    id integer DEFAULT 1 NOT NULL,
    envio_gratis_texto text,
    medios_pago_texto text,
    direccion text,
    instagram_handle text,
    telefono_whatsapp text,
    email_contacto text,
    texto_legal text,
    copyright_anio text,
    hero_titulo text,
    hero_subtitulo text,
    hero_descripcion text,
    hero_imagen_url text,
    actualizado_en timestamp with time zone DEFAULT now(),
    hero_imagen_url_mobile text,
    hero_imagen_posicion_mobile integer DEFAULT 50,
    hero_imagen_posicion_y_desktop integer DEFAULT 50,
    hero_imagen_posicion_y_mobile integer DEFAULT 50,
    hero_slides jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE public.productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    imagenes text[] DEFAULT '{}'::text[] NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    categoria_id uuid,
    genero public.genero_producto DEFAULT 'Unisex'::public.genero_producto NOT NULL,
    tipo_talle public.tipo_talle DEFAULT 'estandar'::public.tipo_talle NOT NULL,
    precio_promocional numeric
);

CREATE TABLE public.talles_por_tipo (
    tipo_talle public.tipo_talle NOT NULL,
    talle text NOT NULL,
    orden smallint NOT NULL
);

CREATE TABLE public.variantes_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    talle character varying(20) NOT NULL,
    color character varying(100) NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    precio numeric NOT NULL,
    visible_en_catalogo boolean DEFAULT true NOT NULL,
    costo numeric
);

CREATE TABLE public.ventas_historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    items jsonb NOT NULL,
    detalles text
);

--
-- Claves Primarias y Únicas (Índices)
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.configuracion_sitio
    ADD CONSTRAINT configuracion_sitio_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.talles_por_tipo
    ADD CONSTRAINT talles_por_tipo_pkey PRIMARY KEY (tipo_talle, talle);

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT variantes_stock_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT uq_variante_producto_talle_color UNIQUE (producto_id, talle, color);

ALTER TABLE ONLY public.ventas_historico
    ADD CONSTRAINT ventas_historico_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT variantes_stock_cantidad_nonnegative CHECK (cantidad >= 0);

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT variantes_stock_precio_nonnegative CHECK (precio >= 0);

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT variantes_stock_costo_nonnegative CHECK (costo IS NULL OR costo >= 0);

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_precio_promocional_nonnegative
    CHECK (precio_promocional IS NULL OR precio_promocional >= 0);

ALTER TABLE ONLY public.configuracion_sitio
    ADD CONSTRAINT configuracion_sitio_singleton CHECK (id = 1);

ALTER TABLE ONLY public.ventas_historico
    ADD CONSTRAINT ventas_historico_items_nonempty_array
    CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0);

--
-- Índices Adicionales
--

CREATE INDEX idx_productos_activo ON public.productos USING btree (activo);
CREATE INDEX idx_productos_categoria_id ON public.productos USING btree (categoria_id);
CREATE INDEX idx_productos_tipo_talle ON public.productos USING btree (tipo_talle);
CREATE INDEX idx_variantes_producto_id ON public.variantes_stock USING btree (producto_id);
CREATE INDEX idx_variantes_visible ON public.variantes_stock USING btree (visible_en_catalogo);

--
-- Claves Foráneas
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.variantes_stock
    ADD CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Funciones / RPCs
--

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
    SELECT COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$function$;

CREATE OR REPLACE FUNCTION public.actualizar_precio_color(p_producto_id uuid, p_color text, p_precio_nuevo numeric)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_filas_afectadas int;
    BEGIN
        UPDATE variantes_stock
        SET precio = p_precio_nuevo
        WHERE producto_id = p_producto_id AND color = p_color;

        GET DIAGNOSTICS v_filas_afectadas = ROW_COUNT;

        IF v_filas_afectadas = 0 THEN
            RETURN json_build_object('status', 'error', 'message', 'No se encontraron variantes para ese producto y color');
        END IF;

        RETURN json_build_object('status', 'success', 'filas_actualizadas', v_filas_afectadas);
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.actualizar_precio_producto(p_producto_id uuid, p_precio_nuevo numeric)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_filas_afectadas int;
    BEGIN
        UPDATE variantes_stock
        SET precio = p_precio_nuevo
        WHERE producto_id = p_producto_id;

        GET DIAGNOSTICS v_filas_afectadas = ROW_COUNT;

        IF v_filas_afectadas = 0 THEN
            RETURN json_build_object('status', 'error', 'message', 'No se encontraron variantes para ese producto');
        END IF;

        RETURN json_build_object('status', 'success', 'filas_actualizadas', v_filas_afectadas);
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.agregar_color_a_producto(p_producto_id uuid, p_color text, p_precio numeric, p_cantidad_inicial integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
    DECLARE
        v_tipo_talle varchar;
    BEGIN
        SELECT tipo_talle INTO v_tipo_talle
        FROM productos
        WHERE id = p_producto_id;

        IF v_tipo_talle IS NULL THEN
            RETURN json_build_object('status', 'error', 'message', 'Producto no encontrado');
        END IF;

        IF EXISTS (
            SELECT 1 FROM variantes_stock
            WHERE producto_id = p_producto_id AND color = p_color
        ) THEN
            RETURN json_build_object('status', 'error', 'message', 'Ese color ya existe para este producto');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM talles_por_tipo WHERE tipo_talle = v_tipo_talle::public.tipo_talle) THEN
            RETURN json_build_object('status', 'error', 'message', 'No hay talles configurados para este tipo de producto');
        END IF;

        INSERT INTO variantes_stock (producto_id, talle, color, cantidad, precio, visible_en_catalogo)
        SELECT p_producto_id, t.talle, p_color, p_cantidad_inicial, p_precio, true
        FROM talles_por_tipo t
        WHERE t.tipo_talle = v_tipo_talle::public.tipo_talle
        ORDER BY t.orden;

        RETURN json_build_object('status', 'success');
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
    END;
    $function$
;

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
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.procesar_venta(items_payload jsonb)
 RETURNS jsonb
LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_item record;
    v_id_variante uuid;
    v_cantidad_solicitada int;
    v_cantidad_actual int;
    v_venta_id uuid;
BEGIN
    -- 1. Validar que el payload sea un array
    IF jsonb_typeof(items_payload) != 'array' THEN
        RAISE EXCEPTION 'Estructura de payload no soportada por el RPC' USING ERRCODE = '22023';
    END IF;

    -- Generar ID único para la transacción de venta
    v_venta_id := gen_random_uuid();

    -- 2. Iterar sobre los items solicitados
    FOR v_item IN SELECT * FROM jsonb_to_recordset(items_payload) AS x(variante_id uuid, cantidad int)
    LOOP
        v_id_variante := v_item.variante_id;
        v_cantidad_solicitada := v_item.cantidad;

        -- Check de constraint lógico
        IF v_cantidad_solicitada <= 0 THEN
            RAISE EXCEPTION 'Violación de restricción de integridad de base de datos' USING ERRCODE = '23514';
        END IF;

        -- 3. Bloqueo de fila (Pessimistic Locking)
        SELECT cantidad INTO v_cantidad_actual 
        FROM variantes_stock 
        WHERE id = v_id_variante 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Registro no encontrado: %', v_id_variante USING ERRCODE = 'P0002';
        END IF;

        -- 4. Validación de negocio
        IF v_cantidad_solicitada > v_cantidad_actual THEN
            RAISE EXCEPTION 'Stock insuficiente para la variante %', v_id_variante USING ERRCODE = 'P0001';
        END IF;

        -- 5. Actualizar el inventario (stock -> cantidad)
        UPDATE variantes_stock 
        SET cantidad = cantidad - v_cantidad_solicitada
        WHERE id = v_id_variante;
    END LOOP;

    -- 6. Inserción en el historial (registro único JSON)
    INSERT INTO ventas_historico (id, items)
    VALUES (v_venta_id, items_payload);

    -- 7. Respuesta exitosa
    RETURN jsonb_build_object(
        'status', 'success',
        'venta_id', v_venta_id,
        'message', 'Venta procesada exitosamente'
    );
END;
$function$
;

--
-- Políticas RLS (Row Level Security)
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talles_por_tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variantes_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_historico ENABLE ROW LEVEL SECURITY;

-- categorias
CREATE POLICY categorias_public_read ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categorias_admin_write ON public.categorias FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- configuracion_sitio
CREATE POLICY configuracion_public_read ON public.configuracion_sitio FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY configuracion_admin_update ON public.configuracion_sitio FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- productos
CREATE POLICY productos_public_active_read ON public.productos FOR SELECT TO anon, authenticated
    USING (activo = true);
CREATE POLICY productos_admin_read ON public.productos FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY productos_admin_insert ON public.productos FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY productos_admin_update ON public.productos FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY productos_admin_delete ON public.productos FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));

-- talles_por_tipo
CREATE POLICY talles_public_read ON public.talles_por_tipo FOR SELECT TO anon, authenticated USING (true);

-- variantes_stock
CREATE POLICY variantes_public_visible_read ON public.variantes_stock FOR SELECT TO anon, authenticated
    USING (
        visible_en_catalogo = true
        AND EXISTS (
            SELECT 1 FROM public.productos AS p
            WHERE p.id = variantes_stock.producto_id AND p.activo = true
        )
    );
CREATE POLICY variantes_admin_read ON public.variantes_stock FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY variantes_admin_insert ON public.variantes_stock FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY variantes_admin_update ON public.variantes_stock FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY variantes_admin_delete ON public.variantes_stock FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));

-- ventas_historico
CREATE POLICY ventas_admin_read ON public.ventas_historico FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY ventas_admin_insert ON public.ventas_historico FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_admin()));

-- No write policies for talles_por_tipo: size definitions are managed by SQL migrations.

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

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

--
-- Triggers
--
-- NOTA: Se verificó el estado de producción en information_schema.triggers
-- y se confirma que NO existen triggers activos en el esquema public.
--
