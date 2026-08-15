-- Fix: Reemplazar 'stock' por 'cantidad' en procesar_venta y corregir INSERT/Permisos
CREATE OR REPLACE FUNCTION procesar_venta(items_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

        -- 5. Actualizar el inventario
        UPDATE variantes_stock 
        SET cantidad = cantidad - v_cantidad_solicitada
        WHERE id = v_id_variante;
    END LOOP;

    -- 6. Inserción en el historial
    -- Corrección: La tabla usa las columnas (id, items, detalles), no variante_id/cantidad_vendida
    INSERT INTO ventas_historico (id, items)
    VALUES (v_venta_id, items_payload);

    -- 7. Respuesta exitosa
    RETURN jsonb_build_object(
        'status', 'success',
        'venta_id', v_venta_id,
        'message', 'Venta procesada exitosamente'
    );
END;
$$;

-- Seguridad: Revocar ejecución pública por el SECURITY DEFINER y restringirla
-- Corrección: El grant estaba también en anon directamente, no solo heredado de PUBLIC.
REVOKE EXECUTE ON FUNCTION procesar_venta(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION procesar_venta(jsonb) FROM PUBLIC;

-- Confirmar permisos para usuarios logueados
GRANT EXECUTE ON FUNCTION procesar_venta(jsonb) TO authenticated;

-- Revertir daño de la venta fantasma de prueba
UPDATE variantes_stock
SET cantidad = 6
WHERE id = '3116be3d-551b-46ce-9151-30825567c12e';

DELETE FROM ventas_historico
WHERE id = 'bbe4f98f-c3e3-4d22-aa4e-2faa2021623a';
