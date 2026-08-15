# **PLATAFORMA WEB E-COMMERCE Y PANEL DE GESTIÓN – WEEKSPORT**

## **Documento de Especificación de Requerimientos y Arquitectura (DERA)**

* **Autor:** Augusto Enrique Pugliano  
* **Entorno Tecnológico:** Next.js 16 (App Router) & Supabase  
* **Estado del Proyecto:** MVP de Backend Consolidado — Módulo Administrador en Fase de Rediseño Premium (Sistema de Diseño y Componentes UI propio en curso)  
* **Fecha de Actualización:** Agosto 2026

---

## **GLOSARIO DE SEMÁFOROS**

* 🟢 **CONSOLIDADO / COMPLETADO:** funcionalidad e infraestructura completamente implementada, probada y validada en producción.  
* 🟡 **EN EJECUCIÓN / EN PROGRESO / A CONFIRMAR:** capa lógica parcialmente operativa, sujeta a pruebas de integración o validación de discrepancias técnicas.  
* 🔴 **PENDIENTE:** requerimiento o entidad planificada que no ha iniciado su ciclo de desarrollo o que presenta dependencias bloqueantes.

---

## **ÍNDICE GENERAL DEL DOCUMENTO**

### **1\. 🟢 VISIÓN GENERAL Y CONTEXTO DEL NEGOCIO**
* **1.1. 🟢 Propósito del Sistema** — digitalización del catálogo y separación arquitectónica entre el e-commerce público y el backoffice privado.  
* **1.2. 🟢 Historia y Naturaleza de la Organización** — contexto del negocio familiar de indumentaria deportiva en Quilmes Oeste.  
* **1.3. 🟢 El Problema Operativo (Puntos de Dolor)** — fricción y "stock fantasma" que motivaron el proyecto.  
* **1.4. 🟢 Modelo Operativo y Reglas de Negocio (Checkout Asincrónico)** — flujo de conciliación manual por WhatsApp.  
* **1.5. 🟢 Objetivos de Ingeniería (Métricas Clave)**  
* **1.6. 🟢 Justificación Arquitectónica** — elección de Supabase (BaaS) y Next.js/Vercel.  
* **1.7. 🟢 Alcance Final (Definición del MVP)** — se mantiene el alcance de CRUD de inventario; rediseño premium.

### **2\. 🟢 ARQUITECTURA TECNOLÓGICA (STACK DESACOPLADO)**
* **2.1. 🟢 Capa Frontend** — Next.js 16, Tailwind CSS v4, cero dependencias externas, librería de UI propia.  
* **2.2. 🟢 Alojamiento y Despliegue** — Vercel + CI/CD vía GitHub.  
* **2.3. 🟢 Capa Backend y Persistencia** — Supabase BaaS.  
* **2.4. 🟢 Estrategia de Carga y Optimización Multimedia** — catálogo dinámico.

### **3\. 🟢 ESPECIFICACIÓN DE REQUERIMIENTOS**
* **3.1. 🟢 Módulo de Cliente (E-commerce Público)**  
* **3.2. 🟢 Módulo de Administrador (Backoffice Privado)**  
* **3.3. 🟢 Requerimientos No Funcionales (RNF)**

### **4\. 🟢 MODELO DE DATOS Y ESTADO DE LA BASE DE DATOS**
* **4.1. 🟢 Evolución del Esquema Relacional**  
* **4.2. 🟢 Diccionario de Datos (Entidades Vigentes)**  
  * 4.2.1. 🟢 categorias  
  * 4.2.2. 🟢 productos  
  * 4.2.3. 🟢 variantes_stock  
  * 4.2.4. 🟢 configuracion_sitio  
  * 4.2.5. 🟢 talles_por_tipo  
  * 4.2.6. 🟢 ventas_historico  
* **4.3. 🟢 Estrategia de Indexación y Optimización**

### **5\. 🟢 SEGURIDAD Y CONFIGURACIÓN DE INFRAESTRUCTURA**
* **5.1. 🟢 Políticas de Seguridad a Nivel de Fila (RLS)**  
* **5.2. 🟢 Infraestructura de Storage**  
* **5.3. 🟢 Control de Acceso en el Servidor (Middleware)**  
* **5.4. 🟢 Configuración del Espacio de Trabajo Local**

### **6\. 🟢 ESPECIFICACIÓN DE MÓDULOS CRÍTICOS Y LÓGICA DE NEGOCIO**
* **6.1. 🟢 Algoritmo de Checkout para WhatsApp**  
* **6.2. 🟢 Arquitectura de Autenticación y Gestión de Sesiones**  
* **6.3. 🟢 Motor de Auto-generación de Variantes Jerárquicas**  
* **6.4. 🟢 Motor de Conciliación con Snapshot Histórico**

### **7\. 🟢 CONTROL DE CALIDAD (QA) Y REGISTRO DE AUDITORÍA**
* **7.1. 🟢 Matriz de Verificación (Casos de Prueba)**  
* **7.2. 🟢 Registro Histórico de Sesiones de Desarrollo**  
* **7.3. 🟢 Registro de Errores Resueltos (Log de Bugs)**

### **8\. 🟡 ROADMAP Y PLAN DE ACCIÓN HACIA EL MVP**
* **8.1. 🟢 Resolución de Deuda Técnico-Inmediata**  
* **8.2. 🔴 Verificación End-to-End (E2E)**  
* **8.3. 🟢 Refactorización de Código: Actualización de Middleware**  
* **8.4. 🔴 Preparación para el Despliegue de Producción (Go-Live)**

### **9\. 🟡 PLAN DE EVOLUCIÓN PREMIUM COMERCIAL & UI/UX**
* **9.1. 🟢 Sistema de Diseño Premium**  
* **9.2. 🟡 Robustez de Infraestructura**

### **10\. 🟡 REGISTRO DE DEUDA TÉCNICA Y REFACTORIZACIONES (BACKLOG)**
* **10.1 a 10.10.** 🟡 Tareas pendientes (QA, Performance, Carga de catálogo real).

---

# **1\. 🟢 VISIÓN GENERAL Y CONTEXTO DEL NEGOCIO**

## **1.1. 🟢 Propósito del Sistema**
Digitalizar el catálogo de WEEKSPORT y sostener una separación arquitectónica clara entre el e-commerce de cara al cliente público y el backoffice de administración privada.

## **1.2. 🟢 Historia y Naturaleza de la Organización**
WEEKSPORT es un emprendimiento familiar de indumentaria y artículos deportivos en Quilmes Oeste. El objetivo es dotar a la marca de una identidad digital profesional para potenciar sus redes sociales, mediante un catálogo público para la captación y un backoffice privado para la administración interna.

## **1.3. 🟢 El Problema Operativo (Puntos de Dolor)**
Previo a este sistema, la administración de inventario se realizaba mediante Google Sheets, causando fricción en la consulta de disponibilidad y "stock fantasma".

## **1.4. 🟢 Modelo Operativo y Reglas de Negocio (Checkout Asincrónico)**
El catálogo opera mediante un "Checkout por Mensajería". El cliente arma su pedido, se redirige a WhatsApp con un mensaje pre-formateado, y el stock se descuenta cuando la administradora valida el pago en el backoffice (generando un snapshot histórico detallado de la venta).

## **1.5. 🟢 Objetivos de Ingeniería (Métricas Clave)**
- Meta de costos fijos $0 USD (Supabase tier gratuito). Se requiere definir el approach respecto a la pausa automática de Supabase tras 7 días de inactividad.
- Estándares de seguridad estrictos (RLS y JWT).
- Rendimiento y latencia mínima.

## **1.6. 🟢 Justificación Arquitectónica**
Se usa Supabase (BaaS) y Next.js en Vercel, evitando monolitos tradicionales, priorizando el Time-to-Market y eliminando costos de infraestructura inicial.

## **1.7. 🟢 Alcance Final (Definición del MVP)**
Catálogo funcional, derivación a WhatsApp, y un CRUD completo de inventario. El panel de administración incluye un sistema de diseño propio y flujos optimizados. No incluye usuarios finales logueados ni integración con pasarelas de pago.

---

# **2\. 🟢 ARQUITECTURA TECNOLÓGICA (STACK DESACOPLADO)**

## **2.1. 🟢 Capa Frontend**
- **Next.js 16 (App Router)**
- **Tailwind CSS v4** (puramente declarativo).
- Cero dependencias UI externas.
- Sistema de componentes propietario para el Admin (`Button`, `Modal`, `BottomSheet`, `TableShell`).

## **2.2. 🟢 Alojamiento y Despliegue**
- **Vercel** con CI/CD automático desde GitHub (rama `main`).

## **2.3. 🟢 Capa Backend y Persistencia**
- **Supabase BaaS (PostgreSQL)**, conectado con `@supabase/supabase-js` y `@supabase/ssr` (cookies sincronizadas seguras en SSR y Middleware).

## **2.4. 🟢 Estrategia de Carga y Optimización Multimedia**
- Catálogo como Server Component asíncrono para consumir la base de datos sin sobrecargar al cliente.
- Imágenes nativas hosteadas en Supabase Storage (bucket público `productos-imagenes`).

---

# **3\. 🟢 ESPECIFICACIÓN DE REQUERIMIENTOS**

## **3.1. 🟢 Módulo de Cliente (E-commerce Público)**
- **Catálogo Dinámico:** Tarjetas generadas dinámicamente.
- **Filtros Avanzados:** Categoría, Talle, Color.
- **Control de Stock Reactivo:** Variantes sin cantidad bloquean compra instantáneamente.
- **Carrito Local:** `localStorage` a través del `CartContext`.
- **Vista de Detalle:** El selector público hace elegir color primero y recién después muestra los talles de ese color. Implementado con Intercepting Routes (`@modal`).
- **Redirección WhatsApp:** Sanitización de entrada y redirección con el resumen de compra.

## **3.2. 🟢 Módulo de Administrador (Backoffice Privado)**
- **Autenticación (Middleware):** Acceso privado por Email/Password vía JWT.
- **Reestructuración Completa de Variantes:** 
  - Variante = color con sus talles agrupados.
  - El producto solo mantiene datos descriptivos. 
  - La capacidad de crear variantes sueltas y eliminar productos recae en Stock.
  - Se agrupan visualmente las variantes por color de forma colapsable. 
  - El precio se edita por color (`actualizar_precio_color`) o por producto completo (`actualizar_precio_producto`).
- **Limpieza del Código:** 
  - Eliminación total del importador de CSV/Excel por decisión comercial (ahora 100% manual).
  - Eliminación de la función obsoleta `crearVariante`.
- **Conciliación (Snapshot Histórico):** Cada venta aprobada guarda un registro transaccional exacto y un snapshot (talle, precio unitario de ese momento, subtotal) inmutable.

## **3.3. 🟢 Requerimientos No Funcionales (RNF)**
- **Mobile First:** Interfaces UI (incluyendo el nuevo patrón Bottom Sheet en el admin) diseñadas para teléfonos.
- **RLS Activo:** Control férreo de acceso a tablas.

---

# **4\. 🟢 MODELO DE DATOS Y ESTADO DE LA BASE DE DATOS**

El esquema de base de datos fue regenerado y sincronizado al estado real de producción (schema.sql actualizado).

## **4.1. 🟢 Entidades Vigentes**

### **categorias**
* Confirmadas 8 categorías de negocio: Accesorios, Buzos y Camperas, Calzas, Colegial, Joggins, Remeras, Shorts y Bermudas, Tops.

### **productos**
* Contiene datos descriptivos puros, `categoria_id`, `genero` y `tipo_talle`.

### **variantes_stock**
* Talle x Color x Cantidad.
* Columnas deprecadas eliminadas permanentemente (`precio_efectivo`, `precio_tarjeta1`, `precio_tarjeta2y3`).
* Administrado transaccionalmente en el backoffice de Stock.

### **configuracion_sitio**
* 🟢 Construida y funcional (singleton id=1). Gestiona el Hero Banner y configuraciones generales desde `/admin/configuracion`.

### **talles_por_tipo**
* Define 6 valores: `unico`, `sin_talle`, `tops`, `estandar`, `ninos`, `colegial`.
* **NOTA RLS:** Esta tabla *NO* tiene políticas de escritura (ni siquiera para `authenticated`). Solo editable vía SQL Editor.

### **ventas_historico**
* Almacena las ventas cerradas.
* 🟢 **RLS Confirmada:** Existen políticas de SELECT e INSERT únicamente para el rol `authenticated`. **NO existen políticas de UPDATE ni DELETE** — ningún rol, ni siquiera `authenticated`, puede modificar o borrar una venta ya registrada. 
* **Pregunta Abierta:** Queda explícito que no está confirmado si esta restricción es una decisión deliberada de inmutabilidad de auditoría, o si es una política incompleta pendiente de definir.

## **4.3. Funciones RPCs Activas**
* `agregar_color_a_producto`: genera todos los talles de un color automáticamente.
* `actualizar_precio_color`: ajusta precios en bloque por color.
* `actualizar_precio_producto`: ajusta precios en bloque para todo el producto.
* `crear_producto_con_variantes`: flujo maestro. Lee talles dinámicamente desde `talles_por_tipo`.
* `procesar_venta`: con REVOKE a público/anon aplicado por seguridad.

---

# **5\. 🟢 SEGURIDAD Y CONFIGURACIÓN DE INFRAESTRUCTURA**

## **5.1. RLS y Permisos**
- **procesar_venta:** 🟢 Parche RLS cerrado y verificado. `REVOKE EXECUTE ON FUNCTION public.procesar_venta FROM public, anon;` implementado.

## **5.2. Storage y Middleware**
- **Vistas heredadas SSR:** 🟢 Resuelto. Las 3 vistas principales del administrador utilizan el cliente de servidor (`@supabase/ssr`) para un fetching seguro y validación de sesión libre de vulnerabilidades.

---

# **6\. 🟢 ESPECIFICACIÓN DE MÓDULOS CRÍTICOS Y LÓGICA DE NEGOCIO**

## **Motor de Generación de Variantes y Stock**
- El esquema migró de una administración atómica (talle por talle) a una gestión jerárquica por "Color".
- Al agregar un color a un producto, la RPC correspondiente (`agregar_color_a_producto`) lee en tiempo real la tabla `talles_por_tipo` e inserta automáticamente toda la curva de talles para ese nuevo color.

## **Motor de Conciliación con Snapshot Histórico**
- Al consolidar un carrito offline, la RPC `procesar_venta` realiza deducciones pesimistas (Pessimistic Locking) de la tabla `variantes_stock` e inserta de forma inmutable un objeto JSONB en `ventas_historico`.

---

# **7\. 🟢 CONTROL DE CALIDAD (QA) Y REGISTRO DE AUDITORÍA**

## **7.1. 🟢 Matriz de Verificación (Casos de Prueba)**
* **TC-01** | Ejecución del servidor local | `cd web && npm run dev` | Compilación limpia, acceso a localhost:3000 sin errores | 🟢 VALIDADO
* **TC-02** | Aislamiento de credenciales | Inspección de `git status` y directivas de exclusión | `.env.local` permanece ignorado por Git | 🟢 VALIDADO
* **TC-03** | Integridad estructural SQL | Inyección de `schema.sql` en el SQL Editor | Creación exitosa de tablas con RLS e índices activos | 🟢 VALIDADO
* **TC-04** | Agrupación de Stock por producto | Prueba manual en navegador | Un producto con N talles se muestra como 1 fila expandible | 🟢 VALIDADO
* **TC-05** | Separación de escritura Productos/Stock | Prueba manual | `cantidad` solo editable desde Stock | 🟢 VALIDADO
* **TC-06** | Snapshot histórico de venta | Prueba manual con datos de producción | `VentaDetalle` muestra producto/talle/color/precio/subtotal correctos | 🟢 VALIDADO
* **TC-07** | Coexistencia de rutas RF-11 | Build de producción (`next build`) | Ambas rutas (directa e interceptada) compilan sin conflicto | 🟢 VALIDADO
* **TC-08** | Atomicidad y validación E2E de `procesar_venta` | Requiere acceso al SQL Editor de Supabase | Confirmar transacción atómica | 🔴 PENDIENTE
* **TC-09** | Creación de color con talles automáticos | Prueba SQL directa: `SELECT agregar_color_a_producto(...)` en transacción de prueba, verificado con `SELECT` posterior | 8 filas creadas con el color y precio correctos | 🟢 VALIDADO
* **TC-10** | Actualización de precio en bloque por color | Prueba SQL directa: `SELECT actualizar_precio_color(...)`, verificado con `SELECT` posterior | Las 8 filas del color actualizan su precio | 🟢 VALIDADO

## **7.2. 🟢 Registro Histórico de Sesiones de Desarrollo**
- Refactor del Modelo de Variantes (Color como eje) y Sistema de Diseño de Backoffice (Agosto 2026).
- Migración y refactorización de Middleware (Agosto 2026).
- Limpieza integral de código muerto y sincronización de Base de Datos (Agosto 2026).

## **7.3. 🟢 Registro de Errores Resueltos (Log de Bugs)**
1. **Colisión de rutas en `/`**: coexistían `src/app/page.tsx` (placeholder) y `src/app/(public)/page.tsx` (catálogo real); Next.js priorizaba el archivo de jerarquía superior, ocultando el catálogo funcional. Se eliminó el archivo placeholder.
2. **Error de compilación en Footer.tsx**: el componente usaba `onMouseEnter`/`onMouseLeave` dentro de un componente de servidor sin declarar su naturaleza interactiva. Se agregó la directiva `'use client'`.
3. **Migración de categorías hardcodeadas a relacionales**: el código dependía de una constante fija `CATEGORIAS` en vez de la base de datos. Se refactorizaron los archivos críticos para usar joins reales contra la tabla `categorias`.
4. **Bucle infinito de redirección en `/admin/login`**: el cliente usaba `createClient` (sesión en localStorage) mientras el middleware evaluaba con `createServerClient` (cookies) — mecanismos incompatibles. Se unificó a `createBrowserClient`.
5. **Excepción de permisos RLS (código 42501) en alta de inventario**: `inventarioService.ts` invocaba al cliente clásico basado en localStorage en vez del cliente SSR con cookies, por lo que el JWT no viajaba en la petición y RLS bloqueaba la escritura. Se refactorizó el servicio para forzar el cliente SSR.
6. **Duplicación visual en Stock por variante plana**: un producto con 3 talles aparecía como 3 filas independientes sin agrupación, dificultando ver el stock total real. Se reestructuró para agrupar por producto en filas expandibles.
7. **Doble camino de escritura sobre cantidad**: el campo podía editarse tanto desde Productos como desde Stock, sin coordinación entre ambos. Se removió la edición desde Producto (pasa a solo lectura).
8. **Rectificación sobre CategoriaDB**: se rectificó una afirmación de un registro anterior sobre una interfaz `CategoriaDB` que en realidad no existía en el repositorio. Se marcó la entrada previa como no verificada.
9. **Bug de selector de categoría en alta de inventario**: el formulario usaba un input de texto libre que requería tipear manualmente el UUID de la categoría. Se resolvió con un select relacional conectado a la tabla `categorias`.
10. **Bug de slider de posición mobile en Hero Banner**: el slider no respondía al arrastre por dos causas combinadas — el valor podía ser undefined en el fetch inicial (solucionado con `?? 50`), y el ajuste modificaba el eje vertical cuando el recorte real ocurre en el eje horizontal (corregido orientando el ajuste al eje X).

**Limpiezas y regeneración de esquema (Agosto 2026)**
* **Importador CSV descontinuado:** Eliminación total de ruta `/importar`, botón UI y dependencia de npm `papaparse`.
* **Función `crearVariante` huérfana:** Eliminada del código.
* **Columnas de tarjetas:** `precio_efectivo`, `precio_tarjeta1`, `precio_tarjeta2y3` purgadas de la DB con `DROP COLUMN`.
* **Talle duplicado:** Eliminado el enum redundante `XXXL` (quedando solo `3XL`).
* **Schema regenerado:** Se sincronizó `schema.sql` validando `talles_por_tipo` y todas las RPC vigentes.

---

# **8\. 🟡 ROADMAP Y PLAN DE ACCIÓN HACIA EL MVP**

* **8.1. 🟢 Resolución de Deuda Técnico-Inmediata:** Cerrada.
* **8.2. 🔴 Verificación End-to-End (E2E):** Validación final por la dueña en uso real del flujo completo.
* **8.3. 🟢 Refactorización de Código: Actualización de Middleware:** **Resuelto y confirmado**. Se comprobó la existencia de `web/src/proxy.ts` (reemplazando `middleware.ts` viejo que fue purgado). Tras auditoría de build (`npm run build`), **no hay warnings de deprecación**.
* **8.4. 🔴 Preparación para el Despliegue de Producción (Go-Live):** Publicación definitiva y estrategias de contingencia operativa.

---

# **9\. 🟡 PLAN DE EVOLUCIÓN PREMIUM COMERCIAL & UI/UX**

* **Sistema de diseño:** Paleta de acentos fucsia, uso intensivo de Bottom Sheets móviles en el Panel, agrupación lógica y colapsable de interfaces.

---

# **10\. 🟡 REGISTRO DE DEUDA TÉCNICA Y REFACTORIZACIONES (BACKLOG)**

* *Este apartado no requiere resolución inmediata, funciona como registro para evolutivos futuros:*
1. **Talles para tipo_talle 'ninos':** Pendiente de decisión de negocio. Actualmente en base de datos solo tiene una fila literal "Niños" en vez de una curva de talles real. Bloquea la carga efectiva de productos infantiles.
2. **Feedback visual Mobile:** Redirección / Toast de éxito al agregar un producto al carrito desde mobile (actualmente ocurre en silencio).
3. **Imágenes de Tarjetas:** Pendiente añadir imágenes a las tarjetas de categoría en la home pública.
4. **WhatsApp Comercial:** Sustituir el número personal del desarrollador en el script de checkout por el WhatsApp Business de la tienda.
5. **Continuidad Supabase:** Investigar y decidir política ante la pausa automática a los 7 días de inactividad (plan de pago vs scripts keep-alive).
6. **Optimización de Imágenes:** El `next.config.ts` está vacío y el catálogo público usa un tag plano `<img>` en lugar del componente `<Image>` optimizado de Next.js.
7. **Traducción:** Refactor de nomenclatura técnica inglés/español pendiente por decisión comercial.
8. **Reutilización:** Extracción de código duplicado en el Frontend (auditoría general).
9. **Next.js config warnings:** Posibles depuraciones futuras si surgieran nuevos cambios de API.
10. **Población de inventario real:** Cargar el catálogo real de productos de forma manual en el panel administrativo (decisión de negocio: reemplaza al importador CSV descontinuado).
