CREATE OR REPLACE FUNCTION public.crear_producto_con_variantes(
    p_nombre VARCHAR,
    p_descripcion TEXT,
    p_categoria_id UUID,
    p_genero VARCHAR,
    p_tipo_talle VARCHAR,
    p_precio_inicial NUMERIC,
    p_imagenes TEXT[],
    p_colores TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON AS $$
DECLARE
    v_producto_id UUID;
    v_talles VARCHAR[];
    v_talle VARCHAR;
    v_color TEXT;
    v_colores_efectivos TEXT[];
BEGIN
    -- Insertar el producto
    INSERT INTO public.productos (nombre, descripcion, categoria_id, genero, tipo_talle, imagenes, activo)
    VALUES (p_nombre, p_descripcion, p_categoria_id, p_genero, p_tipo_talle, p_imagenes, true)
    RETURNING id INTO v_producto_id;

    -- Determinar los talles según el esquema
    IF p_tipo_talle = 'estandar' THEN
        v_talles := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    ELSIF p_tipo_talle = 'unico' THEN
        v_talles := ARRAY['Único'];
    ELSIF p_tipo_talle = 'tops' THEN
        v_talles := ARRAY['85', '90', '95', '100', '105', '110', '115', '120+'];
    ELSIF p_tipo_talle = 'sin_talle' THEN
        v_talles := ARRAY['N/A'];
    ELSE
        v_talles := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    END IF;

    -- Si no se proporcionaron colores, usar un único color genérico
    IF p_colores IS NULL OR array_length(p_colores, 1) IS NULL OR array_length(p_colores, 1) = 0 THEN
        v_colores_efectivos := ARRAY['Sin color'];
    ELSE
        v_colores_efectivos := p_colores;
    END IF;

    -- Insertar variantes: una por cada combinación talle × color
    FOREACH v_talle IN ARRAY v_talles
    LOOP
        FOREACH v_color IN ARRAY v_colores_efectivos
        LOOP
            INSERT INTO public.variantes_stock (producto_id, talle, color, cantidad, precio)
            VALUES (v_producto_id, v_talle, v_color, 0, p_precio_inicial);
        END LOOP;
    END LOOP;

    RETURN json_build_object(
        'status', 'success',
        'producto_id', v_producto_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'status', 'error',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
