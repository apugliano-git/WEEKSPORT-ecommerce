# Diccionario y Esquema de Base de Datos — WEEKSPORT

Este documento detalla la estructura física de la base de datos PostgreSQL alojada en Supabase, incluyendo tipos de datos enumerados, tablas, relaciones, índices, funciones almacenadas (RPCs) y políticas de seguridad (RLS).

---

## 1. Tipos de Datos Enumerados (ENUMs)

### `genero_producto`
Define el público objetivo del producto:
- `'Hombre'`
- `'Mujer'`
- `'Unisex'`
- `'Niños'`

### `tipo_talle`
Define el esquema de talles que utiliza el producto para generar su matriz de variantes:
- `'unico'`: Para accesorios o artículos de talle único (ej: gorras, canilleras).
- `'sin_talle'`: Artículos sin variante dimensional.
- `'tops'`: Indumentaria superior (ej: remeras, buzos, camperas: `XS`, `S`, `M`, `L`, `XL`, `XXL`).
- `'estandar'`: Indumentaria inferior o estándar (ej: pantalones, shorts: `38`, `40`, `42`, etc.).
- `'ninos'`: Talles infantiles (ej: `4`, `6`, `8`, `10`, `12`, `14`, `16`).
- `'colegial'`: Talles escolares o juveniles.

---

## 2. Tablas del Sistema

### 2.1. `categorias`
Almacena las clasificaciones generales de los productos.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria. |
| `nombre` | `varchar` | NO | - | Nombre visible (ej: "Camisetas"). |
| `slug` | `varchar` | NO | - | Identificador único para URLs (ej: "camisetas"). |
| `imagen_url`| `text` | SÍ | - | URL pública de la imagen de portada. |
| `created_at`| `timestamptz` | SÍ | `now()` | Fecha de creación. |

- **Restricciones:** `PRIMARY KEY (id)`, `UNIQUE (slug)`.
- **Índices:** la restricción `UNIQUE (slug)` ya provee el índice necesario; no se crea un índice redundante.

---

### 2.2. `configuracion_sitio`
Registro único (ID: 1) con los parámetros globales y contenidos configurables del frontend.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `integer` | NO | `1` | Clave primaria fija. |
| `envio_gratis_texto` | `text` | SÍ | - | Texto del banner superior sobre envíos. |
| `medios_pago_texto` | `text` | SÍ | - | Texto explicativo sobre métodos de pago. |
| `direccion` | `text` | SÍ | - | Dirección física del local. |
| `instagram_handle` | `text` | SÍ | - | Usuario de Instagram para enlace en footer. |
| `telefono_whatsapp` | `text` | SÍ | - | Número receptor para los pedidos del checkout. |
| `email_contacto` | `text` | SÍ | - | Correo electrónico comercial. |
| `texto_legal` | `text` | SÍ | - | Términos o información legal del pie de página. |
| `copyright_anio` | `text` | SÍ | - | Año o leyenda de copyright. |
| `hero_titulo` | `text` | SÍ | - | Título principal de portada. |
| `hero_subtitulo` | `text` | SÍ | - | Subtítulo del banner. |
| `hero_descripcion` | `text` | SÍ | - | Párrafo secundario del banner. |
| `hero_slides` | `jsonb` | SÍ | `'[]'::jsonb` | Array de objetos de slides (`id`, `desktop_url`, `mobile_url`, posiciones X/Y). |
| `actualizado_en` | `timestamptz` | SÍ | `now()` | Fecha de última edición. |

---

### 2.3. `productos`
Registro maestro de artículos publicados o en catálogo.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria. |
| `nombre` | `varchar(255)` | NO | - | Nombre comercial del producto. |
| `descripcion` | `text` | SÍ | - | Detalle o especificaciones técnicas. |
| `imagenes` | `text[]` | NO | `'{}'::text[]` | Lista ordenada de URLs públicas en Supabase Storage. |
| `activo` | `boolean` | NO | `true` | Estado de visibilidad general en la tienda. |
| `categoria_id` | `uuid` | SÍ | - | Referencia a `categorias(id)`. |
| `genero` | `genero_producto`| NO | `'Unisex'` | Clasificación por género. |
| `tipo_talle` | `tipo_talle` | NO | `'estandar'` | Esquema usado para generar variantes. |
| `precio_promocional`| `numeric` | SÍ | - | Precio de oferta (anula visualmente el precio base). |
| `created_at` | `timestamptz` | NO | `now()` | Fecha de creación. |

- **Claves Foráneas:** `FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT`.
- **Índices:** `idx_productos_activo`, `idx_productos_categoria_id`, `idx_productos_tipo_talle`.

---

### 2.4. `talles_por_tipo`
Tabla de referencia para desacoplar los talles de la lógica dura en frontend.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `tipo_talle` | `tipo_talle` | NO | - | Tipo de esquema dimensional. |
| `talle` | `text` | NO | - | Nombre/etiqueta del talle (ej: "S", "M", "42"). |
| `orden` | `smallint` | NO | - | Posición ordinal para mostrar en selectores. |

- **Restricciones:** `PRIMARY KEY (tipo_talle, talle)`.

---

### 2.5. `variantes_stock`
Unidad mínima de inventario (SKU tácito). Relaciona producto, talle y color con cantidad y precio.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Clave primaria. |
| `producto_id` | `uuid` | NO | - | Referencia a `productos(id)`. |
| `talle` | `varchar(20)` | NO | - | Talle correspondiente. |
| `color` | `varchar(100)`| NO | - | Color correspondiente. |
| `cantidad` | `integer` | NO | `0` | Cantidad de unidades en stock físico. |
| `precio` | `numeric` | NO | - | Precio de venta unitario base. |
| `costo` | `numeric` | SÍ | - | Costo unitario (uso administrativo/márgenes). |
| `visible_en_catalogo`| `boolean`| NO | `true` | Habilita o deshabilita la variante individual. |

- **Restricciones:** 
  - `PRIMARY KEY (id)`
  - `UNIQUE (producto_id, talle, color)`
  - `FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE`
  - `CHECK (cantidad >= 0)`, `CHECK (precio >= 0)` y `CHECK (costo IS NULL OR costo >= 0)`
- **Índices:** `idx_variantes_producto_id`, `idx_variantes_visible`.

---

### 2.6. `ventas_historico`
Registro inmutable de transacciones completadas (terminal POS / Mostrador).

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Identificador único de la transacción. |
| `items` | `jsonb` | NO | - | Snapshot de artículos vendidos (`variante_id`, `cantidad`, `precio_unitario`, `nombre`, etc.). |
| `detalles` | `text` | SÍ | - | Notas opcionales o medio de pago. |
| `created_at` | `timestamptz` | SÍ | `now()` | Fecha y hora de la transacción. |

- **Restricciones:** `CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0)`. No hay políticas de `UPDATE` o `DELETE` en Data API: el historial es inmutable.

---

## 3. Funciones Almacenadas (RPCs)

### 3.1. `crear_producto_con_variantes`
Crea de manera atómica un producto e inserta todas las variantes correspondientes a partir del esquema de talles y colores.

```sql
crear_producto_con_variantes(
    p_nombre varchar,
    p_descripcion text,
    p_categoria_id uuid,
    p_genero varchar,
    p_tipo_talle varchar,
    p_precio_inicial numeric,
    p_imagenes text[] DEFAULT ARRAY[]::text[],
    p_colores text[] DEFAULT ARRAY[]::text[],
    p_cantidades jsonb DEFAULT '{}'::jsonb
) RETURNS json
```
- **Seguridad y validación:** requiere `app_metadata.role = "admin"`, nombre/categoría/precio válidos, colores no vacíos ni duplicados y un objeto de cantidades entero/no negativo cuyas claves sean talles configurados.
- **Flujo:** inserta el producto y realiza `CROSS JOIN` entre `talles_por_tipo` y colores; `p_cantidades[talle]` se copia a cada color y los talles ausentes reciben cero. No captura excepciones: cualquier error revierte producto y variantes.

---

### 3.2. `procesar_venta`
Procesa una orden de mostrador de forma atómica aplicando bloqueo pesimista.

```sql
procesar_venta(items_payload jsonb) RETURNS jsonb
```
- **Firma de Seguridad:** `SECURITY INVOKER`, `SET search_path = ''`, requiere `public.is_admin()` y sólo `authenticated` tiene `EXECUTE`; `anon` y `public` están revocados.
- **Payload esperado:** `[{"variante_id": "UUID", "cantidad": 2}, ...]`; el cliente no puede aportar nombres ni precios.
- **Flujo:**
  1. Rechaza payload nulo/no-array/vacío, más de 100 items, IDs inválidos o duplicados y cantidades no enteras fuera de `1..10000`.
  2. Bloquea todas las variantes por UUID ordenado.
  3. Verifica existencia y stock de todas las filas antes de descontar; una excepción revierte stock e historial.
  4. Construye dentro de la transacción el snapshot con nombre, talle, color, precio de la base y subtotal.
  5. Inserta una fila inmutable en `ventas_historico` y retorna `{"status": "success", "venta_id": "...", "message": "Venta procesada exitosamente"}`.

---

### 3.3. `agregar_color_a_producto`
Añade un nuevo color a un producto existente, generando las filas para todos sus talles.

```sql
agregar_color_a_producto(
    p_producto_id uuid,
    p_color text,
    p_precio numeric,
    p_cantidad_inicial integer DEFAULT 0
) RETURNS json
```

---

### 3.4. `actualizar_precio_producto` y `actualizar_precio_color`
- `actualizar_precio_producto(p_producto_id uuid, p_precio_nuevo numeric)`: Actualiza masivamente el precio de todas las variantes de un producto.
- `actualizar_precio_color(p_producto_id uuid, p_color text, p_precio_nuevo numeric)`: Actualiza el precio de las variantes de un color específico dentro de un producto.

---

## 4. Políticas de Seguridad por Fila (Row Level Security - RLS)

Todas las tablas públicas tienen RLS habilitado. `public.is_admin()` devuelve verdadero únicamente para el claim server-controlled `app_metadata.role = "admin"`:

| Tabla | Operación | Rol | Condición / Política |
|---|---|---|---|
| `categorias` | `SELECT` | `anon`, `authenticated` | Lectura habilitada; escritura sólo si `is_admin()`. |
| `configuracion_sitio` | `SELECT` | `anon`, `authenticated` | Lectura habilitada; `UPDATE` sólo si `is_admin()`. |
| `productos` | `SELECT` | `anon`, `authenticated` | No-admin sólo ve `activo = true`; admin ve todos. |
| `productos` | `INSERT`, `UPDATE`, `DELETE` | `authenticated` | Requiere `is_admin()`. |
| `talles_por_tipo` | `SELECT` | `anon`, `authenticated` | Lectura; no hay políticas de escritura. |
| `variantes_stock` | `SELECT` | `anon`, `authenticated` | No-admin sólo ve variantes visibles de productos activos; admin ve todas. |
| `variantes_stock` | `INSERT`, `UPDATE`, `DELETE` | `authenticated` | Requiere `is_admin()`. |
| `ventas_historico`| `SELECT`, `INSERT` | `authenticated` | Requiere `is_admin()`; no hay `UPDATE`/`DELETE`. |

### Storage

El bucket público `productos-imagenes` limita objetos a 5 MiB y a `image/jpeg`, `image/png`, `image/webp` o `image/avif`. La lectura pública existe para servir el storefront; insertar, actualizar o borrar objetos requiere `is_admin()`.

### Despliegue

`supabase/migrations/202609020001_security_integrity_hardening.sql` es la única migración desplegable. Es fail-fast: el preflight aborta si hay datos incompatibles con las nuevas restricciones. Para backup, provisión del administrador, verificación y rollback consultar `supabase/DEPLOYMENT.md`; no ejecutar parches históricos.
