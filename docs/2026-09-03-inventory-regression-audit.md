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

## Tareas operativas para Luna xhigh

No hay SQL ni migración pendiente para estos arreglos.

Pasarle a Luna xhigh este bloque después del deploy:

1. Con una cuenta administradora, abrir `/admin/inventario/nuevo`, agregar dos colores, presionar Backspace con el input vacío y confirmar que ambos permanecen. Eliminarlos sólo con sus botones visibles.
2. Sin guardar un producto real, cambiar rápidamente entre los cuatro esquemas de talles y confirmar que el preview final coincide con el esquema seleccionado y no mezcla cantidades anteriores.
3. En `/admin/stock`, registrar producto, variante y cantidad original. Cambiar una unidad desde mobile, comprobar el total sin cerrar la página, recargar y comprobar persistencia. Restaurar inmediatamente el valor original y volver a recargar.
4. Repetir el ajuste reversible desde desktop y confirmar que cambian la fila y el total del producto.
5. Medir en producción tres navegaciones calientes a `/`, `/admin/stock` y `/admin/productos`; guardar TTFB y duración de las solicitudes a Supabase para comparar con el deploy anterior.
6. Generar, sin borrar nada, un reporte de objetos de `productos-imagenes` no referenciados por `productos.imagenes`, `categorias.imagen_url` ni la configuración/carrusel. Entregar la lista y el tamaño total para aprobación antes de cualquier limpieza.
