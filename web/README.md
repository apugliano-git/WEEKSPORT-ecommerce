# WEEKSPORT — Plataforma E-commerce de Indumentaria Deportiva

> Catálogo digital con carrito de compras y checkout por WhatsApp, más panel privado de administración de stock para las responsables del negocio.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router) + TypeScript |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Base de Datos** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Autenticación** | Supabase Auth (JWT) |
| **Storage** | Supabase Buckets (imágenes de productos) |
| **Deploy** | [Vercel](https://vercel.com/) |

---

## Estructura del Repositorio

```
WEEKSPORT/
├── supabase/
│   └── schema.sql          # Script SQL: tablas, RLS, índices
└── web/                    # Código fuente de la aplicación Next.js
    ├── src/
    │   ├── app/            # App Router (páginas y layouts)
    │   ├── lib/
    │   │   └── supabase.ts # Cliente Supabase (singleton)
    │   └── ...
    ├── public/
    ├── .env.example        # Template de variables de entorno
    └── package.json
```

---

## Primeros Pasos (Configuración Local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/weeksport.git
cd weeksport/web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` con las credenciales reales de tu proyecto en Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
```

> ⚠️ Encontrás estas credenciales en **supabase.com → tu proyecto → Settings → API**

### 4. Configurar la Base de Datos

En el **SQL Editor** de tu proyecto en Supabase, ejecutá el contenido de:

```
supabase/schema.sql
```

Esto crea las tablas `productos` y `variantes_stock` con sus políticas de seguridad (RLS).

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

---

## Módulos Previstos (Fase 1)

### Catálogo Público (usuarios)
- [x] Estructura base y design system
- [ ] Listado de productos con filtros (talle, color, categoría)
- [ ] Carrito de compras (persistido en `localStorage`)
- [ ] Checkout por WhatsApp

### Panel de Administración (admins)
- [ ] Login seguro con Supabase Auth
- [ ] Gestión de inventario (CRUD de productos y variantes)
- [ ] Validación manual de ventas (descuento de stock)

---

## Variables de Entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto en Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase | ✅ |

---

## Deploy en Vercel

1. Importar el repositorio desde [vercel.com/new](https://vercel.com/new)
2. Configurar el **Root Directory** como `web/`
3. Agregar las variables de entorno en **Settings → Environment Variables**
4. Vercel detecta Next.js automáticamente y realiza el deploy

---

## Seguridad

- Las políticas **Row Level Security (RLS)** de Supabase garantizan que el catálogo sea de lectura pública, pero las operaciones de escritura requieren autenticación de administrador.
- Nunca subir `.env.local` al repositorio (ya está en `.gitignore`).
- La `SUPABASE_SERVICE_ROLE_KEY` nunca debe usarse en el frontend ni en variables `NEXT_PUBLIC_`.

---

*Proyecto desarrollado por [Tu Nombre] — Junio 2026*
