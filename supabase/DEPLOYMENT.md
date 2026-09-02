# WEEKSPORT database deployment runbook

The base hardening migration and the Storage follow-up were applied and verified manually on 2026-09-02. Apply later timestamped migrations in order through the normal Supabase migration workflow.

## Before applying

1. Confirm that the target project and branch are correct.
2. Create and verify a database backup. Keep its timestamp and retention details with the deployment record.
3. Run these read-only checks in the Supabase SQL editor and save the result:

```sql
select count(*) as negative_stock from public.variantes_stock where cantidad < 0;
select count(*) as negative_prices from public.variantes_stock where precio < 0;
select count(*) as negative_costs from public.variantes_stock where costo < 0;
select count(*) as negative_promotions from public.productos where precio_promocional < 0;
select count(*) as non_singleton_config from public.configuracion_sitio where id <> 1;
select count(*) as invalid_sales from public.ventas_historico
where jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0;
```

All counts must be zero. Do not repair rows as part of this migration. Investigate, export, and review any repair separately.

## Provision the administrator first

Before applying the RLS migration, assign `app_metadata.role = "admin"` to the existing administrator using the Supabase Dashboard or a one-off trusted server environment. Never do this from the browser and never put a service-role key in Git.

Force that user to sign in again after the metadata change so the JWT contains the new claim. A stale JWT will correctly be treated as non-admin until it is refreshed.

## Apply and verify

Apply `supabase/migrations/202609020001_security_integrity_hardening.sql` through the normal Supabase migration workflow. Do not paste the old patch files in `supabase/`.

If the base migration is already installed, apply `supabase/migrations/202609020002_storage_admin_read.sql`. It keeps anonymous bucket listing disabled while restoring the `SELECT` permission administrators need to update existing objects.

After applying, run these read-only checks:

```sql
select conname from pg_constraint
where conrelid in (
  'public.productos'::regclass,
  'public.configuracion_sitio'::regclass,
  'public.variantes_stock'::regclass,
  'public.ventas_historico'::regclass
)
order by conname;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select routine_schema, routine_name, routine_type, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_admin', 'crear_producto_con_variantes',
    'agregar_color_a_producto', 'actualizar_precio_color',
    'actualizar_precio_producto', 'procesar_venta'
  )
order by routine_name;

select policyname, roles, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'productos_imagenes_%'
order by policyname;
```

Verify with an admin session that the current dashboard can read and write its intended resources. Verify with an anonymous session that only public catalog data is readable and all writes, sales history, inactive products, and invisible variants are denied.

Deploy the web branch only after these checks pass. Roll back by restoring the verified backup or by applying a separately reviewed reverse migration; this migration does not claim automatic reversibility.

## Cypher

Cypher is not part of this rollout. Supabase Auth remains the token issuer and the only identity source for WEEKSPORT.
