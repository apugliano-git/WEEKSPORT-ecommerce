-- Aplicar antes de desplegar el formulario. No modifica productos existentes.
BEGIN;

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

    -- Compatible con el formato anterior por talle durante el despliegue.
    IF NOT EXISTS (
        SELECT 1 FROM jsonb_each(v_cantidades) AS entry(key, value)
        WHERE jsonb_typeof(value) = 'object'
    ) THEN
        SELECT jsonb_object_agg(color, v_cantidades)
        INTO v_cantidades FROM unnest(v_colores) AS colors(color);
    END IF;
    IF EXISTS (
        SELECT 1 FROM jsonb_each(v_cantidades) AS entry(color, stock)
        WHERE NOT (color = ANY(v_colores)) OR jsonb_typeof(stock) <> 'object'
    ) THEN
        RAISE EXCEPTION 'El stock debe contener talles por cada color válido' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_each(v_cantidades) AS entry(color, stock)
        CROSS JOIN LATERAL jsonb_each_text(stock) AS quantity(size_name, value)
        WHERE value IS NULL OR value !~ '^[0-9]+$'
           OR CASE WHEN value ~ '^[0-9]+$' THEN value::numeric > 2147483647 ELSE false END
    ) THEN
        RAISE EXCEPTION 'Las cantidades deben ser enteros no negativos' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM jsonb_each(v_cantidades) AS entry(color, stock)
        CROSS JOIN LATERAL jsonb_object_keys(stock) AS requested(size_name)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.talles_por_tipo
            WHERE tipo_talle = v_tipo_talle AND talle = requested.size_name
        )
    ) THEN
        RAISE EXCEPTION 'La cantidad referencia un talle no configurado' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.productos (nombre, descripcion, categoria_id, genero, tipo_talle, imagenes, activo)
    VALUES (btrim(p_nombre), p_descripcion, p_categoria_id, v_genero, v_tipo_talle, COALESCE(p_imagenes, ARRAY[]::text[]), true)
    RETURNING id INTO v_producto_id;

    INSERT INTO public.variantes_stock (producto_id, talle, color, cantidad, precio)
    SELECT v_producto_id, size.talle, color.value,
           COALESCE((v_cantidades -> color.value ->> size.talle)::integer, 0), p_precio_inicial
    FROM public.talles_por_tipo AS size
    CROSS JOIN unnest(v_colores) AS color(value)
    WHERE size.tipo_talle = v_tipo_talle
    ORDER BY size.orden;

    RETURN json_build_object('status', 'success', 'producto_id', v_producto_id);
END;
$function$;

NOTIFY pgrst, 'reload schema';
COMMIT;
