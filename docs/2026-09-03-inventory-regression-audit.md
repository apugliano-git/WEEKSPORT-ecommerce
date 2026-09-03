# Auditoría de regresiones de inventario y rendimiento

**Objetivo:** corregir los fallos encontrados por el cliente al crear productos y ajustar stock, verificar las demás escrituras administrativas y recuperar la latencia perdida en la rama de endurecimiento.

**Alcance técnico:** Next.js 16, React 19 y Supabase/PostgREST. No requiere una migración SQL: las políticas RLS actuales permiten las operaciones de administradores; el cliente debe detectar cuando una política o un ID inválido deja una mutación sin filas afectadas.

## Hallazgos confirmados

### 1. Backspace elimina colores ya agregados

- **Ubicación:** `web/src/app/admin/(protected)/inventario/nuevo/page.tsx`.
- **Causa raíz:** `handleColorKeyDown` llama explícitamente a `eliminarColor(colores.length - 1)` cuando el input está vacío y se presiona Backspace.
- **Solución:** conservar Enter como atajo para agregar y reservar la eliminación para el botón visible de cada color.
- **Estado:** corregido y verificado en navegador: agregar `Azul`, dejar el input vacío y presionar Backspace conserva el color. La eliminación queda en el botón `Eliminar color Azul`.

### 2. El ajuste de stock móvil vuelve a mostrar el valor anterior

- **Ubicación:** `web/src/components/admin/StockManager.tsx`.
- **Causa raíz:** el refactor `e418dab` reemplazó la mutación de la variante compartida por estado local dentro de `MobileVariantAdjust`. Ese componente se desmonta al volver al listado, por lo que el valor confirmado se pierde visualmente. Los totales de escritorio tampoco se recalculan.
- **Solución:** mantener una copia local de productos en `StockManager` y actualizar allí la variante confirmada, tanto en desktop como mobile.
- **Estado:** corregido. `StockManager` mantiene un snapshot local inmutable y todos los componentes notifican el valor confirmado.

### 3. Supabase puede responder “sin error” aunque no haya modificado nada

- **Ubicaciones:** `inventarioService.ts`, `productoService.ts`, `variantesService.ts`, categorías y configuración.
- **Causa raíz:** los `update`/`delete` terminan en `.eq(...)` sin solicitar la fila afectada. PostgREST puede devolver una respuesta exitosa con cero filas cuando el ID no existe o RLS oculta el registro.
- **Solución:** finalizar cada mutación con `.select('id').single()` y mostrar el error real si no vuelve exactamente una fila. Para stock, verificar además la cantidad persistida.
- **Estado:** corregido. Hay una prueba de contrato que primero reprodujo el falso éxito y ahora exige el error de Supabase.

### 4. Consultas repetidas y en cascada agregan latencia

- **Ubicaciones:** layout/página/footer de tienda y páginas de stock, productos, ventas y dashboard.
- **Causa raíz:** `configuracion_sitio` se consulta hasta tres veces en una misma navegación; categorías, productos, talles y métricas independientes se esperan en serie.
- **Solución:** deduplicar la configuración por request con `cache()` de React y ejecutar lecturas independientes con `Promise.all`.
- **Estado:** corregido. La configuración usa una única promesa cacheada por request y las lecturas independientes se lanzan en paralelo.

### 5. El formulario podía reutilizar stock del producto anterior o mezclar esquemas

- **Ubicación:** `web/src/app/admin/(protected)/inventario/nuevo/page.tsx`.
- **Causas raíz:** al crear dos productos seguidos con esquema estándar no se reiniciaban las cantidades, porque asignar de nuevo `estandar` no cambia el estado; además, dos respuestas de talles podían llegar fuera de orden si se cambiaba rápido de esquema. El preview mantenía una segunda lista hardcodeada distinta de la base.
- **Solución:** limpiar talles y cantidades al cambiar/reiniciar, cancelar respuestas obsoletas y construir el preview con `tallesDisponibles`.
- **Estado:** corregido.

### 6. Archivos huérfanos en Storage

- **Ubicaciones:** alta/edición/eliminación de productos, categorías y configuración.
- **Causa raíz:** Storage y PostgreSQL no comparten transacción. Si una subida funciona y la mutación posterior falla, o si una URL se quita del producto, el objeto físico puede quedar en el bucket. La eliminación de producto tampoco borra esos objetos.
- **Solución recomendada:** inventariar objetos del bucket, compararlos con todas las URLs referenciadas y borrar sólo los no referenciados después de revisión. No conviene automatizar una baja en línea sin resolver referencias compartidas y rollback.
- **Estado:** tarea operativa; se corrigió el texto del modal para no afirmar falsamente que elimina fotos.

## Plan de ejecución

- [x] Escribir y observar fallar la prueba de sincronización inmutable de una variante.
- [x] Implementar el estado local compartido de stock y conectar desktop/mobile.
- [x] Escribir y observar fallar la prueba que rechaza una actualización sin fila devuelta.
- [x] Exigir confirmación de fila en todas las mutaciones administrativas directas.
- [x] Quitar la acción destructiva de Backspace.
- [x] Deduplicar configuración y paralelizar lecturas independientes.
- [x] Ejecutar tests, lint, TypeScript limpio y build completos.
- [x] Revisar el diff con un segundo agente y resolver sus observaciones bloqueantes.

## Evidencia de verificación

- TDD rojo → verde: `withVariantStock`, el reinicio de talles y el falso éxito de `actualizarStockVariante` fallaron antes de sus arreglos; luego pasaron.
- Suite: 12 archivos, 17 pruebas aprobadas.
- Calidad: ESLint sin errores y `npx tsc --noEmit --incremental false` sin errores.
- Producción: `next build --webpack` completó todas las rutas.
- Navegador: Backspace conservó el color agregado y el catálogo público cargó productos, imágenes y configuración.
- Supabase real, smoke reversible: `TOP BUZIO ESTAMPADO`, variante `Verde / 120+`, pasó temporalmente de 1 a 2; el total móvil cambió de 7 a 8, la recarga confirmó 2; luego se restauró a 1, el total volvió a 7 y otra recarga confirmó la restauración.
- No se creó ni eliminó ningún producto durante la verificación.

## Ejecución post-deploy (2026-09-03)

- [x] Flujo móvil ejecutado en producción con dos colores (`Azul`, `Rojo`): Backspace con el input vacío conservó ambos; la eliminación sólo ocurrió desde los botones visibles.
- [x] Los cuatro esquemas se cambiaron rápidamente sin guardar el formulario. El preview terminó en `4 talles × 2 colores` para Tops, `1 talle × 2 colores` para Único, `1 talle × 2 colores` para Sin talle y `8 talles × 2 colores` para Estándar.
- [x] Stock móvil reversible: `1 → 2`, total `7 → 8`, recarga confirmó `8`; restauración `2 → 1`, total `7`, segunda recarga confirmó `7`.
- [x] Stock escritorio reversible: `1 → 2`, la fila mostró `OK` y el total `8`; restauración `2 → 1`, total `7`, recarga confirmó `7`.
- [x] Navegaciones autenticadas medidas tres veces por ruta (DOMContentLoaded observado desde el cliente): `/` `1109/787/992 ms`, `/admin/stock` `1031/883/908 ms`, `/admin/productos` `835/1079/874 ms`.
- [x] Medición HTTP adicional: `/` respondió `200` con TTFB `0.483 s` y total `0.881 s`; las rutas administrativas sin sesión responden `307` (`/admin/stock`: TTFB `0.164 s`, total `0.164 s`; `/admin/productos`: TTFB `0.136 s`, total `0.136 s`).
- [x] Inventario de objetos huérfanos ejecutado en el SQL Editor: devolvió 53 candidatos por `31.138.465` bytes (aprox. `29,7 MiB`), con fechas entre el 28/06/2026 y el 18/08/2026. Como durante ese período la clienta estuvo cargando productos, se decidió conservarlos todos; no se borró ni se modificó ningún objeto.

**Decisión de retención:** estos 53 objetos no deben tratarse como basura. El flujo actual sube los archivos antes de confirmar el producto por RPC, por lo que un intento incompleto, una edición o una baja anterior puede dejar una imagen sin referencia actual. La consulta es un inventario de candidatos, no una orden de borrado. No agregar limpieza automática ni borrar por lote sin asociar/revisar cada archivo.

### Consulta de sólo lectura para Storage

La consulta compara todos los objetos de `productos-imagenes` con las URLs referenciadas por productos, categorías y configuración/carrusel. Devuelve únicamente candidatos huérfanos; no elimina ni modifica datos.

```sql
with referenced_urls as (
  select unnest(coalesce(p.imagenes, array[]::text[])) as url
  from public.productos as p
  union all
  select c.imagen_url
  from public.categorias as c
  where c.imagen_url is not null
  union all
  select s.hero_imagen_url
  from public.configuracion_sitio as s
  where s.hero_imagen_url is not null
  union all
  select s.hero_imagen_url_mobile
  from public.configuracion_sitio as s
  where s.hero_imagen_url_mobile is not null
  union all
  select slide ->> 'desktop_url'
  from public.configuracion_sitio as s
  cross join lateral jsonb_array_elements(coalesce(s.hero_slides, '[]'::jsonb)) as slide
  where slide ->> 'desktop_url' is not null
  union all
  select slide ->> 'mobile_url'
  from public.configuracion_sitio as s
  cross join lateral jsonb_array_elements(coalesce(s.hero_slides, '[]'::jsonb)) as slide
  where slide ->> 'mobile_url' is not null
), referenced as (
  select distinct trim(regexp_replace(
    url,
    '^.*/storage/v1/object/(public|sign)/productos-imagenes/',
    ''
  )) as name
  from referenced_urls
  where url ~ '/storage/v1/object/(public|sign)/productos-imagenes/'
), orphan_objects as (
  select
    o.name,
    o.created_at,
    coalesce((o.metadata ->> 'size')::bigint, 0) as bytes
  from storage.objects as o
  left join referenced as r on r.name = o.name
  where o.bucket_id = 'productos-imagenes'
    and r.name is null
)
select name, created_at, bytes,
       count(*) over () as orphan_object_count,
       coalesce(sum(bytes) over (), 0) as orphan_total_bytes
from orphan_objects
order by created_at desc, name;
```

Si el resultado no es vacío, exportar la lista y revisarla antes de borrar cualquier objeto. Las referencias compartidas y el rollback de Storage deben resolverse primero.

## Tareas operativas para Luna xhigh

No hay migración SQL pendiente para estos arreglos. La consulta anterior es sólo un inventario de Storage y no requiere aplicar cambios de esquema.

Pasarle a Luna xhigh este bloque después del deploy:

1. Con una cuenta administradora, abrir `/admin/inventario/nuevo`, agregar dos colores, presionar Backspace con el input vacío y confirmar que ambos permanecen. Eliminarlos sólo con sus botones visibles.
2. Sin guardar un producto real, cambiar rápidamente entre los cuatro esquemas de talles y confirmar que el preview final coincide con el esquema seleccionado y no mezcla cantidades anteriores.
3. En `/admin/stock`, registrar producto, variante y cantidad original. Cambiar una unidad desde mobile, comprobar el total sin cerrar la página, recargar y comprobar persistencia. Restaurar inmediatamente el valor original y volver a recargar.
4. Repetir el ajuste reversible desde desktop y confirmar que cambian la fila y el total del producto.
5. Medir en producción tres navegaciones calientes a `/`, `/admin/stock` y `/admin/productos`; guardar TTFB y duración de las solicitudes a Supabase para comparar con el deploy anterior.
6. Generar, sin borrar nada, un reporte de objetos de `productos-imagenes` no referenciados por `productos.imagenes`, `categorias.imagen_url` ni la configuración/carrusel. Entregar la lista y el tamaño total para aprobación antes de cualquier limpieza.
