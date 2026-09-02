# WEEKSPORT — Plataforma de E-Commerce & Back-Office (POS / ERP Ligero)

Sistema web para la gestión comercial y operativa de **WEEKSPORT**. Integra un catálogo público de venta con checkout directo vía WhatsApp y un panel administrativo para control de inventario multi-variante, registro de ventas de mostrador (POS), personalización de contenidos y métricas en tiempo real.

---

## 📌 Módulos del Sistema

### 1. Storefront Público
- **Catálogo y Filtros:** Navegación por categorías y filtrado combinado (género, talle, color, rango de precios).
- **Ficha de Producto (Rutas Interceptadas):** Vista detallada mediante modal o navegación directa (`/producto/[id]`), selector reactivo de variantes según stock disponible y carrusel de imágenes.
- **Precios y Descuentos:** Soporte para precios promocionales con cálculo visual de descuentos.
- **Carrito y Checkout:** Carrito persistido localmente con generación de pedido estructurado para cierre de venta por WhatsApp.
- **Banner Principal:** Hero dinámico con carrusel configurable de imágenes (versiones desktop y mobile).

### 2. Panel Administrativo (`/admin`)
- **Dashboard:** Métricas generales del negocio, accesos directos y alertas de stock crítico (`<= 1` o `< 3`).
- **Alta de Inventario (`/admin/inventario/nuevo`):** Formulario para creación atómica de productos con su matriz completa de talles y colores en base de datos.
- **Gestión de Catálogo (`/admin/productos`):** Edición de información, reordenamiento de imágenes, control de visibilidad y asignación de precios promocionales.
- **Ajuste Rápido de Stock (`/admin/stock`):** Interfaz para actualización rápida de existencias, con vista tabular para escritorio y controles táctiles (bottom sheets) para dispositivos móviles.
- **Punto de Venta / POS (`/admin/ventas`):** Terminal para registrar ventas de mostrador con descuento de stock y guardado de histórico inmutable.
- **Gestión de Categorías (`/admin/categorias`):** Administración de categorías de producto y asignación de imágenes de portada.
- **Configuración del Sitio (`/admin/configuracion`):** Edición en vivo de banners del Hero, número de WhatsApp de ventas, textos de envío, medios de pago y datos legales.
- **Autenticación (`/admin/login`):** Acceso protegido mediante Supabase Auth con sesiones validadas por middleware SSR.

La autorización administrativa requiere exactamente el claim server-controlled `app_metadata.role = "admin"`; estar `authenticated`, pertenecer a un dominio de correo o tener un valor en `user_metadata` no concede permisos. PostgreSQL RLS y las funciones RPC vuelven a comprobar esta condición. Las variantes públicas sólo se leen cuando pertenecen a un producto activo y tienen `visible_en_catalogo = true`. El POS construye el snapshot de venta dentro de PostgreSQL con el precio/nombre vigentes y `ventas_historico` no admite actualizaciones ni borrados por Data API.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Uso en el proyecto |
|---|---|---|
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16.3.4 (App Router) | Renderizado híbrido (Server y Client Components), Server Actions y rutas API. |
| **Librería UI** | [React 19](https://react.dev/) | Construcción de interfaces interactivas y hooks de estado. |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) | Sistema de utilidades CSS, diseño responsive y modo oscuro. |
| **Carruseles** | Embla Carousel | Desplazamiento táctil e interactivo en Hero Banner y fichas de producto. |
| **Base de Datos & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+) | Almacenamiento relacional, autenticación JWT, Row Level Security (RLS) y Storage. |
| **Lógica Transaccional** | PL/pgSQL (Funciones RPC) | Ejecución atómica (ACID) de operaciones críticas como creación de matriz de variantes y ventas con descuento de stock. |
| **Mantenimiento / Cron** | GitHub Actions / Vercel Cron | Ejecución periódica programada para prevenir la suspensión por inactividad de Supabase. |
| **Despliegue** | [Vercel](https://vercel.com/) | Hosting del frontend y funciones serverless. |

---

## 📁 Estructura del Repositorio

```
WEEKSPORT/
├── .github/
│   └── workflows/
│       └── supabase-keep-alive.yml   # Workflow para ping periódico a Supabase
├── supabase/
│   ├── schema.sql                    # Esquema canónico de tablas, RLS y RPCs
│   ├── migrations/                   # Única migración desplegable ordenada
│   └── DEPLOYMENT.md                 # Preflight, rollout y rollback revisado
├── web/                              # Aplicación Next.js
│   ├── public/                       # Assets estáticos (iconos, imágenes)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (store)/              # Rutas del catálogo público
│   │   │   │   ├── @modal/           # Ruta interceptada para modal de producto
│   │   │   │   └── producto/[id]/    # Vista completa de producto
│   │   │   ├── admin/                # Shell, login y grupo protegido
│   │   │   │   ├── (protected)/      # Todas las rutas operativas admin
│   │   │   │   └── login/            # Inicio de sesión administrativo
│   │   │   ├── api/
│   │   │   │   └── cron/keepalive/   # Endpoint auxiliar para healthcheck
│   │   │   ├── globals.css           # Estilos base y variables de Tailwind v4
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── manifest.ts           # Configuración PWA / Web Manifest
│   │   ├── components/
│   │   │   ├── admin/                # Componentes del panel administrativo
│   │   │   ├── cart/                 # Drawer y lógica de carrito
│   │   │   ├── catalog/              # Tarjetas de producto, filtros y Hero
│   │   │   ├── layout/               # Header, Footer y barra de búsqueda
│   │   │   ├── product/              # Galería, modal y selector de variantes
│   │   │   └── ui/                   # Componentes base reutilizables
│   │   ├── context/                  # Contextos de React (CartContext, SearchContext)
│   │   ├── lib/
│   │   │   ├── supabase/             # Clientes Supabase (Browser, Server SSR, Middleware)
│   │   │   ├── dashboardService.ts   # Consultas de analítica y métricas
│   │   │   ├── inventarioService.ts  # Manejo de stock e imágenes
│   │   │   ├── productoService.ts    # CRUD de productos y promociones
│   │   │   ├── variantesService.ts   # CRUD de variantes individuales
│   │   │   └── ventasService.ts      # Invocación de RPC para ventas
│   │   ├── proxy.ts                  # Integración de middleware de Next.js
│   │   ├── types/                    # Tipos e interfaces de TypeScript
│   │   └── utils/                    # Funciones utilitarias (generador de WhatsApp, etc.)
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json                   # Configuración de despliegue y cron en Vercel
├── ARCHITECTURE.md                   # Documentación técnica de arquitectura y diseño
├── DATABASE.md                       # Diccionario de base de datos, RPCs y RLS
└── README.md                         # Guía general y puesta en marcha
```

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js 20 o superior
- Gestor de paquetes `npm`
- Proyecto configurado en [Supabase](https://supabase.com)

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/apugliano-git/WEEKSPORT-ecommerce.git
cd WEEKSPORT-ecommerce/web
npm install
```

### 2. Variables de entorno
Crear un archivo `.env.local` dentro de la carpeta `web/` con los siguientes datos:

```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-publica"
```

### 3. Configuración de Base de Datos en Supabase
1. Ingresar al **SQL Editor** de Supabase.
2. Para una instalación nueva, ejecutar `supabase/schema.sql`. Para una base existente, seguir exclusivamente `supabase/DEPLOYMENT.md` y aplicar `supabase/migrations/202609020001_security_integrity_hardening.sql` después del preflight; no ejecutar parches SQL sueltos.
3. La migración configura el bucket público `productos-imagenes`, limitado a 5 MiB y JPEG/PNG/WebP/AVIF. Las escrituras de Storage requieren `app_metadata.role = "admin"`.

### 4. Iniciar el entorno de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📚 Documentación Técnica Detallada

Para consultar especificaciones técnicas profundas, revisar los siguientes documentos:

- **[ARCHITECTURE.md](file:///home/augep/Documentos/Proyectos/WEEKSPORT/ARCHITECTURE.md):** Patrones de renderizado en Next.js, flujo de autenticación SSR, ciclo de transacciones ACID y diseño de soluciones.
- **[DATABASE.md](file:///home/augep/Documentos/Proyectos/WEEKSPORT/DATABASE.md):** Diccionario de tablas, tipos de datos, funciones RPC detalladas, restricciones de integridad y políticas RLS.

### Decisión de identidad

Cypher no está integrado. Supabase Auth sigue siendo el único emisor de tokens e identidad de WEEKSPORT; reevaluar Cypher sólo si varios servicios necesitan una autoridad común y existe compatibilidad OIDC completa, eligiendo un único issuer.
