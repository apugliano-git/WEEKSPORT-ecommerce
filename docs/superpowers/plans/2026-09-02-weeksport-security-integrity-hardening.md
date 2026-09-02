# WEEKSPORT Security, Integrity, and Cleanup Implementation Plan

> **TEMPORARY EXECUTION DOCUMENT:** remove this file only after every mandatory task is implemented, reviewed, and merged.
>
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` and execute this plan inline, task by task, with its review checkpoints. Do not redesign the system, integrate Cypher, apply SQL to a remote database, rewrite Git history, or skip a failing check. Use TDD for behavior changes: add the smallest failing test, confirm the expected failure, implement the minimum fix, then rerun the focused and full checks.

**Goal:** Make WEEKSPORT safe and reproducible without changing its current catalog, inventory, sales, or administrator workflows.

**Architecture:** Keep Next.js and Supabase as the only application and identity stack. Move authorization to a real `admin` claim enforced by both Next.js and PostgreSQL RLS, make database state reproducible through one ordered migration, validate writes at the database boundary, and remove only proven dead code. Cypher is explicitly out of scope for this implementation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth/Postgres/Storage, PostgreSQL RLS and PL/pgSQL, npm.

**Spec:** The repository audit performed on 2026-09-02 and the decisions recorded in this document.

## Global Constraints

- Create and work only on branch `security/integrity-hardening` from a clean `main` at `d0a75bc22642673734a4d67ccea52980093e9206` or its direct successor.
- Preserve the current storefront, admin URLs, product/variant management, stock adjustment, checkout, and sales-history behavior.
- Do not connect WEEKSPORT to Cypher in this branch.
- Do not apply migrations, mutate data, change Supabase settings, rotate keys, or create users in any remote environment.
- Never use `user_metadata` for authorization. The sole administrator claim is `app_metadata.role = "admin"`.
- Never commit a service-role key, password, private key, `.env.local`, production dump, or customer data.
- Do not use `npm audit fix --force`, broad automatic rewrites, or destructive Git commands.
- Do not rewrite existing Git history. Removing a tracked file means a normal deletion in this branch.
- Every database mutation must be protected by RLS or an equally restrictive function permission; UI checks are not security boundaries.
- Database migrations must fail on invalid existing data instead of silently correcting or deleting it.
- Keep sales history immutable: administrators may insert and read sales, but not update or delete them through the Data API.
- The only permitted pre-branch working-tree change is this untracked temporary plan under `docs/`; any other change is a stop condition.
- A phase is complete only when its focused checks pass and `git diff --check` is clean.

## Decision: Supabase Auth, Not Cypher

Use Supabase Auth for WEEKSPORT now. Supabase-issued JWTs are natively consumed by PostgREST, `auth.uid()`, `auth.jwt()`, Storage RLS, and the existing `@supabase/ssr` session refresh. Replacing it with Cypher would require either a custom token-exchange bridge or replacing the Supabase Data API authorization path; simply presenting a Cypher JWT will not make the existing RLS session work.

Cypher has useful building blocks—RS256/JWKS, Argon2id, Redis rate limiting, refresh-token rotation, and audit logs—but its current repository is not a complete OAuth2/OIDC provider despite the README wording. It has no OIDC discovery document, standard authorization/token endpoints, issuer/audience validation, PKCE flow, client registry, logout/revocation endpoint, email verification, password reset, or MFA. It also creates a second user database and a second session lifecycle.

Reconsider Cypher only when at least two independently deployed services need one identity authority and Cypher first satisfies a separate production-readiness plan. At that point choose one issuer; do not operate Supabase Auth and Cypher as competing sources of user identity.

Primary references:

- Supabase RLS and JWT authorization: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase custom claims/RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Supabase database functions: https://supabase.com/docs/guides/database/functions
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Cypher repository inspected for this decision: https://github.com/apugliano-git/Cypher-Auth-Service

## Required Deliverables

The final branch must contain:

- `supabase/migrations/202609020001_security_integrity_hardening.sql`: the only new deployable migration.
- An updated `supabase/schema.sql` matching the post-migration schema.
- `supabase/DEPLOYMENT.md`: preflight, administrator provisioning, migration, verification, and rollback instructions.
- A server/browser authorization helper and focused automated tests.
- Upload validation shared by product and category image flows, with focused tests.
- Updated dependencies with a reviewed lockfile and zero known high/critical production vulnerabilities.
- A green production build, green tests, and a recorded lint baseline improvement.
- No obsolete dangerous SQL patches, hardcoded Supabase project identifiers, unused Puppeteer dependency, or unused starter SVGs.

---

### Task 1: Create the branch and record the immutable baseline

**Files:**

- Do not modify application files in this task.

**Interfaces:**

- Consumes: clean `main` checkout.
- Produces: branch `security/integrity-hardening` and baseline command output for comparison.

- [ ] Verify `git status --short` contains only `?? docs/` for this temporary plan. If any other path appears, stop and report it; do not stash or discard user changes.
- [ ] Run `git switch -c security/integrity-hardening`.
- [ ] Commit this plan on the new branch with `git add docs/superpowers/plans/2026-09-02-weeksport-security-integrity-hardening.md && git commit -m "docs: add security hardening execution plan"` so subsequent baseline checks start clean.
- [ ] Record `git rev-parse HEAD`, `node --version`, and `npm --version` in the execution report, not in a tracked file.
- [ ] From `web/`, run `npm ci`, `npm run build`, `npm run lint`, and `npm audit --omit=dev --json`.
- [ ] Confirm the expected baseline: build passes; lint currently reports approximately 61 errors and 22 warnings; audit output may differ from the 2026-09-02 snapshot and must be treated as authoritative for the installed lockfile.
- [ ] Confirm `git status --short` is empty before Task 2.

### Task 2: Add a minimal test runner before changing behavior

**Files:**

- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Create: `web/src/lib/security/auth.test.ts`
- Create: `web/src/lib/security/uploads.test.ts`

**Interfaces:**

- Consumes: TypeScript source under `web/src`.
- Produces: `npm test` using Vitest and two initially failing behavior specifications used by Tasks 3 and 7.

- [ ] Install Vitest as a development-only dependency with `npm install --save-dev vitest`.
- [ ] Add scripts: `"test": "vitest run"` and `"test:watch": "vitest"`.
- [ ] Create `auth.test.ts` importing `isAdminUser` from `./auth` and asserting literal cases: missing user is false, `{ app_metadata: {} }` is false, `{ app_metadata: { role: 'USER' } }` is false, and `{ app_metadata: { role: 'admin' } }` is true.
- [ ] Create `uploads.test.ts` importing `validateImageUpload` from `./uploads` and asserting: zero-byte file rejected, file over 5 MiB rejected, SVG rejected, JPEG/PNG/WebP/AVIF accepted, and the returned extension is derived from MIME rather than the original filename.
- [ ] Run `npm test`; confirm failure is caused only by missing `auth.ts` and `uploads.ts`.
- [ ] Commit with `test: define security boundary behavior`.

### Task 3: Enforce a real administrator role in Next.js

**Files:**

- Create: `web/src/lib/security/auth.ts`
- Modify: `web/src/lib/supabase/middleware.ts`
- Modify: `web/src/app/admin/login/page.tsx`
- Modify: `web/src/app/admin/layout.tsx`
- Create: `web/src/app/admin/(protected)/layout.tsx`
- Move: `web/src/app/admin/page.tsx` to `web/src/app/admin/(protected)/page.tsx`
- Move: `web/src/app/admin/loading.tsx` to `web/src/app/admin/(protected)/loading.tsx`
- Move without renaming: `categorias/`, `configuracion/`, `inventario/`, `productos/`, `stock/`, and `ventas/` from `web/src/app/admin/` into `web/src/app/admin/(protected)/`

**Interfaces:**

- Consumes: Supabase `User | null`, specifically server-controlled `app_metadata.role`.
- Produces: `isAdminUser(user: Pick<User, 'app_metadata'> | null | undefined): boolean` and defense-in-depth checks for all admin routes.

- [ ] Implement `isAdminUser` as an exact comparison to lowercase string `admin`; do not accept `authenticated`, `user_metadata`, email domains, or client-provided roles.
- [ ] Run `npm test -- auth.test.ts`; confirm all role cases pass.
- [ ] In middleware, keep `supabase.auth.getUser()` and redirect every `/admin` request except `/admin/login` unless `isAdminUser(user)` is true. Redirect unauthenticated users to `/admin/login`; redirect authenticated non-admin users to `/admin/login?error=forbidden`.
- [ ] In the login page, after `signInWithPassword`, call `getUser()`, verify `isAdminUser`, sign out a non-admin user, show a generic authorization error, and never navigate to `/admin` for that user.
- [ ] Remove the unused `useRouter` import and variable.
- [ ] Keep `admin/layout.tsx` as an unprotected metadata/children shell because it also wraps `/admin/login`; remove `AdminNav` from this root layout.
- [ ] Create the `(protected)` route-group layout with the existing visual shell and `AdminNav`, plus a server-side `getUser()` and `isAdminUser()` check that redirects to `/admin/login` when false. Moving routes into a parenthesized route group must not change any public URL.
- [ ] Verify `/admin/login` renders without redirect while `/admin`, `/admin/productos`, `/admin/stock`, `/admin/ventas`, `/admin/categorias`, `/admin/configuracion`, and `/admin/inventario/nuevo` all pass through the protected layout.
- [ ] Run `npm test`, `npm run build`, and ESLint on every file created, moved, or modified in this task.
- [ ] Commit with `fix(auth): require explicit admin role`.

### Task 4: Create one canonical, fail-fast database migration

**Files:**

- Create: `supabase/migrations/202609020001_security_integrity_hardening.sql`
- Modify: `supabase/schema.sql`
- Create: `supabase/DEPLOYMENT.md`

**Interfaces:**

- Consumes: existing public tables and Supabase JWT claims.
- Produces: `public.is_admin()`, validated constraints, deterministic RLS, restricted RPC execution, and a reproducible schema.

- [ ] Begin the migration with a PL/pgSQL preflight block that raises an exception if any existing row has `cantidad < 0`, `precio < 0`, `costo < 0`, `precio_promocional < 0`, `configuracion_sitio.id <> 1`, malformed non-array `ventas_historico.items`, or an empty sales array. Do not update those rows.
- [ ] Create `public.is_admin()` as a `stable` SQL boolean function with `set search_path = ''` returning `coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)`.
- [ ] Add named constraints: `variantes_stock_cantidad_nonnegative`, `variantes_stock_precio_nonnegative`, `variantes_stock_costo_nonnegative`, `productos_precio_promocional_nonnegative`, `configuracion_sitio_singleton`, and `ventas_historico_items_nonempty_array`.
- [ ] Remove the redundant `idx_categorias_slug`; the unique constraint `categorias_slug_key` already creates an index.
- [ ] Drop every policy on the six application tables inside a controlled loop over `pg_policies`, limited exactly to `categorias`, `configuracion_sitio`, `productos`, `talles_por_tipo`, `variantes_stock`, and `ventas_historico` in schema `public`.
- [ ] Recreate public read policies: categories and sizes readable; site configuration readable; only active products readable; only visible variants belonging to active products readable.
- [ ] Recreate admin policies using `(select public.is_admin())`: full write access for categories/products/variants; update-only for site configuration; full read access to all products/variants; insert/select only for sales history.
- [ ] Do not create write policies for `talles_por_tipo`.
- [ ] Explicitly revoke execution on every mutating RPC from `PUBLIC` and `anon`: `crear_producto_con_variantes`, `agregar_color_a_producto`, `actualizar_precio_color`, `actualizar_precio_producto`, and `procesar_venta`.
- [ ] Grant those RPCs to `authenticated`; their bodies must run as invoker or independently verify `public.is_admin()` before writes. `procesar_venta` must not remain an unrestricted `SECURITY DEFINER` function in the exposed `public` schema.
- [ ] Keep `schema.sql` as the canonical fresh-install equivalent of the migration result. It must not contain contradictory `GRANT ... TO anon/public` statements.
- [ ] In `DEPLOYMENT.md`, document this safe order: back up database; run preflight queries; set `app_metadata.role=admin` for the existing administrator using the Supabase Dashboard or a one-off trusted server environment; force that user to sign in again; verify the refreshed JWT; apply the migration; run read-only verification queries; deploy the web app.
- [ ] Document rollback as restoration from the backup or a separately reviewed reverse migration. Do not claim the migration is automatically reversible.
- [ ] If a local Supabase/Postgres instance is available, apply the migration there twice: the first run must succeed and the second must either succeed idempotently or fail with an explicitly documented duplicate-migration condition before any partial change. Never test against production.
- [ ] Run `rg -n "GRANT EXECUTE.*(anon|public)|SECURITY DEFINER" supabase` and manually justify every remaining match.
- [ ] Commit with `fix(db): enforce admin RLS and data constraints`.

### Task 5: Repair product creation without losing initial stock

**Files:**

- Modify: `supabase/migrations/202609020001_security_integrity_hardening.sql`
- Modify: `supabase/schema.sql`
- Modify: `web/src/lib/inventarioService.ts`

**Interfaces:**

- Consumes: `p_cantidades jsonb`, keyed by size name, and existing color/size inputs.
- Produces: one product and the complete size × color variant matrix with the requested initial quantity copied to every color of that size.

- [ ] Define the canonical RPC signature with `p_cantidades jsonb default '{}'::jsonb` after the existing optional array parameters.
- [ ] Validate inside PostgreSQL: nonblank trimmed product name, valid category, `p_precio_inicial >= 0`, no blank colors, no duplicate normalized colors, every quantity value is an integer `>= 0`, and every quantity key belongs to the selected `talles_por_tipo` set.
- [ ] Insert variant quantity with `coalesce((p_cantidades ->> t.talle)::integer, 0)` instead of always zero.
- [ ] Allow PostgreSQL exceptions to abort the transaction. Do not catch `WHEN OTHERS` and return an error JSON after partial work.
- [ ] Keep the response shape `{ "status": "success", "producto_id": <uuid> }` so the existing service contract remains compatible.
- [ ] In TypeScript, retain `p_cantidades: payload.cantidades ?? {}` and replace `any` response casts with a narrow runtime guard for the returned JSON object.
- [ ] Test on local PostgreSQL: valid product, missing quantities default to zero, negative quantity rejected, unknown size rejected, duplicate color rejected, and any failure leaves zero new product/variant rows.
- [ ] Commit with `fix(inventory): restore atomic initial stock creation`.

### Task 6: Make sales history authoritative and immutable

**Files:**

- Modify: `supabase/migrations/202609020001_security_integrity_hardening.sql`
- Modify: `supabase/schema.sql`
- Modify: `web/src/lib/ventasService.ts`
- Modify: `web/src/components/admin/VentasManager.tsx`

**Interfaces:**

- Consumes: client payload containing only `variante_id` UUID and positive integer `cantidad`.
- Produces: atomic stock decrement and server-built sales snapshot containing `variante_id`, `cantidad`, `nombre_producto`, `talle`, `color`, `precio_unitario`, and `subtotal`.

- [ ] Change the browser payload type to `Pick<VentaItem, 'variante_id' | 'cantidad'>[]`; retain the richer local cart type only for UI totals.
- [ ] Before the RPC call, map the cart to those two fields so client-provided names and prices never enter history.
- [ ] In `procesar_venta`, reject null/non-array/empty arrays, more than 100 entries, null IDs, non-integer quantities, quantities outside `1..10000`, and duplicate variant IDs.
- [ ] Require `(select public.is_admin())`; return an authorization error before locking stock when false.
- [ ] Lock all referenced variant rows in deterministic UUID order to reduce deadlock risk.
- [ ] Build the snapshot by joining `variantes_stock` to `productos` inside the transaction and use the database price for subtotal.
- [ ] Decrement stock only after verifying every requested variant exists and every row has enough stock. A rejected sale must change neither stock nor history.
- [ ] Insert one immutable `ventas_historico` row and keep the existing successful response fields `status`, `venta_id`, and `message`.
- [ ] Test locally: empty sale, duplicate variant, negative/zero quantity, excessive quantity, unknown variant, insufficient stock, successful multi-item sale, and two concurrent sales competing for the final unit. Assert stock and history together.
- [ ] Commit with `fix(sales): build trusted atomic sale snapshots`.

### Task 7: Enforce image safety in code and Supabase Storage

**Files:**

- Create: `web/src/lib/security/uploads.ts`
- Modify: `web/src/lib/inventarioService.ts`
- Modify: `web/src/app/admin/categorias/page.tsx`
- Modify: `supabase/migrations/202609020001_security_integrity_hardening.sql`
- Modify: `supabase/schema.sql`

**Interfaces:**

- Consumes: browser `File` values and Storage object writes.
- Produces: `validateImageUpload(file): { ok: true; extension: 'jpg' | 'png' | 'webp' | 'avif' } | { ok: false; error: string }`.

- [ ] Implement accepted MIME types exactly: `image/jpeg`, `image/png`, `image/webp`, and `image/avif`; reject SVG, GIF, empty files, and files over 5 MiB.
- [ ] Derive the stored extension from the MIME map, never from `file.name`, and name objects `${crypto.randomUUID()}.${extension}`.
- [ ] Call the validator inside `subirImagenProducto`; return a generic Spanish validation error without exposing Storage internals.
- [ ] Keep the category page using the same shared upload function; revoke every created `URL.createObjectURL` when replaced or on unmount.
- [ ] In the migration, update bucket `productos-imagenes` to a 5 MiB limit and the four exact MIME types where supported by the installed Storage schema.
- [ ] Replace Storage write policies with admin-only insert/update/delete policies using `(select public.is_admin())`; keep the bucket public only because the storefront intentionally serves product images publicly.
- [ ] Run `npm test -- uploads.test.ts`, the full tests, changed-file lint, and build.
- [ ] Commit with `fix(storage): restrict product image uploads`.

### Task 8: Fail closed and add production security headers

**Files:**

- Modify: `web/src/app/api/cron/keepalive/route.ts`
- Modify: `web/next.config.ts`

**Interfaces:**

- Consumes: `CRON_SECRET`, request Authorization header, and browser responses.
- Produces: fail-closed cron authentication and production response headers.

- [ ] Make the cron return 401 whenever `CRON_SECRET` is absent or the header is not exactly `Bearer ${CRON_SECRET}`.
- [ ] Return a generic 500 body and log only a stable error label; do not return `error.message` to callers.
- [ ] Keep the cron operation read-only.
- [ ] Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- [ ] Add a Content Security Policy compatible with the current app: default/self; scripts and styles self plus the minimum Next.js inline allowance; images self/blob/data/https; fonts self and Google Fonts static host; connections self plus HTTPS/WSS to the configured Supabase host; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`.
- [ ] Do not use wildcard `*` for scripts, connections, frames, or forms.
- [ ] Run the production build and inspect headers with a local production server using `curl -I http://localhost:3000/` and `curl -I http://localhost:3000/admin`.
- [ ] Commit with `fix(web): fail closed and harden response headers`.

### Task 9: Update vulnerable dependencies without blind upgrades

**Files:**

- Modify: `web/package.json`
- Modify: `web/package-lock.json`

**Interfaces:**

- Consumes: npm advisory data for the actual lockfile.
- Produces: reviewed dependency versions with no known high/critical production vulnerabilities.

- [ ] Upgrade `next` and `eslint-config-next` together to at least `16.2.11`; the 2026-09-02 audit recommended `16.3.4` for both. Use the newest non-prerelease patch compatible with React 19 only if current npm audit requires a later fix.
- [ ] Upgrade `@tailwindcss/postcss` and lockfile transitive versions so patched `postcss`, `sharp`, `browserslist`, `js-yaml`, `nanoid`, and `brace-expansion` versions are selected.
- [ ] Never run `npm audit fix --force`.
- [ ] Run `npm audit --omit=dev`; require zero high or critical production findings. Record moderate findings with exploitability analysis if any remain.
- [ ] Run `npm audit`; resolve high/critical development findings unless the only fix requires a major breaking toolchain upgrade, in which case record the exact advisory and dependency chain.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Commit with `chore(deps): update vulnerable packages`.

### Task 10: Remove proven dead and dangerous artifacts

**Files:**

- Delete: `web/check_db.js`
- Delete: `web/public/file.svg`
- Delete: `web/public/globe.svg`
- Delete: `web/public/next.svg`
- Delete: `web/public/vercel.svg`
- Delete: `web/public/window.svg`
- Delete: `supabase/fix_rpc_anon.sql`
- Delete: `supabase/fix_rpc_permissions.sql`
- Delete: `supabase/fix_columna_stock_procesar_venta.sql`
- Delete: `supabase/actualizar_talles_rpc.sql`
- Delete: `supabase/parche_rlS_ventas.sql`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Modify: documentation references if deletion makes them inaccurate.

**Interfaces:**

- Consumes: canonical migration and schema from Tasks 4–7.
- Produces: one unambiguous SQL source of truth and no hardcoded project probe.

- [ ] Use `rg` to reconfirm none of the five SVGs is referenced before deletion.
- [ ] Remove the hardcoded Supabase URL/publishable key by deleting `check_db.js`; do not replace it with another tracked credential probe.
- [ ] Delete the contradictory patch SQL files only after their intended final behavior exists in the canonical migration and `schema.sql`. Git history remains the recovery mechanism.
- [ ] Remove unused `puppeteer` with `npm uninstall --save-dev puppeteer`; do not remove Embla because `HeroBanner` uses it.
- [ ] Re-run `rg -n "sb_publishable_|GRANT EXECUTE.*(anon|public)" . -g '!web/package-lock.json' -g '!.git/**'`; expected result is no hardcoded publishable key and no public mutation grant.
- [ ] Run tests, lint, build, and `git diff --check`.
- [ ] Commit with `chore: remove obsolete security artifacts`.

### Task 11: Consolidate Supabase clients by runtime

**Files:**

- Delete: `web/src/lib/supabase.ts`
- Modify: `web/src/lib/ventasService.ts`
- Modify: `web/src/app/(store)/page.tsx`
- Modify: `web/src/app/(store)/producto/[id]/page.tsx`
- Modify: `web/src/app/(store)/@modal/(.)producto/[id]/page.tsx`

**Interfaces:**

- Consumes: browser factory `@/lib/supabase/client` and server factory `@/lib/supabase/server`.
- Produces: exactly one client factory per runtime, with cookie-aware server access.

- [ ] Update `ventasService.ts` to instantiate the browser factory.
- [ ] Update all three server-rendered storefront pages to await the server factory.
- [ ] Delete the global client only after `rg -n "@/lib/supabase(['\"]|$)" web/src` returns no consumers.
- [ ] Preserve existing query columns and filtering behavior.
- [ ] Replace duplicated similar-product filtering and ordering with one pure server helper only if doing so reduces total lines and all three routes retain equivalent output.
- [ ] Replace render-time `Math.random()` shuffling with a deterministic pure order derived from current product ID plus candidate product ID; this keeps variety between products while producing stable renders.
- [ ] Run build and changed-file lint; manually open home, direct product detail, and intercepted product modal in local production mode.
- [ ] Commit with `refactor(supabase): use runtime-specific clients`.

### Task 12: Make the lint gate useful and remove type escape hatches

**Files:**

- Modify only files reported by `npm run lint`, prioritizing `web/src/lib/**`, `web/src/app/**`, then components.
- Create shared types only in `web/src/types/index.ts` when at least two consumers use the type.
- Create `web/src/components/admin/variantUtils.ts` only if it replaces duplicated grouping/sorting logic in both large admin components.

**Interfaces:**

- Consumes: existing `Producto`, `VarianteStock`, Supabase responses, and React state.
- Produces: zero ESLint errors; warnings allowed only with an inline, specific justification.

- [ ] Replace every `catch (err: any)` with `catch (error: unknown)` and expose only generic user messages; use a small `getErrorMessage` helper only where a trusted internal log needs the message.
- [ ] Replace `any` variant/product/sale shapes with existing types, indexed access types, or narrow local interfaces reflecting actual Supabase query results.
- [ ] Remove unused imports/variables including login `router`, ProductCard `useState`/`useCart`, ProductInfo `VarianteStock`, and unused catalog/category props where behavior does not require them.
- [ ] Fix React effect lint findings by deriving state during render or initializing state lazily. Do not silence `set-state-in-effect`, purity, or immutability rules globally.
- [ ] For cart localStorage, use a lazy initializer guarded by `typeof window !== 'undefined'`, validate parsed data as an array of cart-shaped objects, and fall back to an empty cart on malformed storage.
- [ ] Extract duplicated pure variant sort/group behavior from `ProductTable.tsx` and `StockManager.tsx` only after characterization tests cover talle order, color grouping, visible flag, and quantities.
- [ ] Do not split large UI files merely to meet a line target. After security behavior is green, extract only self-contained pure helpers or repeated components with unchanged props.
- [ ] Run `npm run lint`; required result is 0 errors. Resolve warnings that indicate dead code. Image optimization warnings may remain only where Supabase public URLs cannot be configured safely for `next/image`, and each remaining suppression must explain that reason.
- [ ] Run tests and build after lint is green.
- [ ] Commit with `refactor: remove unsafe types and lint failures`.

### Task 13: Update documentation to match reality

**Files:**

- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DATABASE.md`
- Modify: `web/README.md`

**Interfaces:**

- Consumes: implemented branch behavior.
- Produces: documentation with no security claims stronger than the code.

- [ ] Replace every statement equating `authenticated` with administrator with the exact `app_metadata.role = admin` rule.
- [ ] Document that public variant reads require both active product and `visible_en_catalogo = true`.
- [ ] Document authoritative server-built sales snapshots and immutable history.
- [ ] Document the canonical migration path and remove instructions to run ad hoc SQL patch files.
- [ ] State that publishable/anon keys are public identifiers whose safety depends on RLS; never call them secrets.
- [ ] Add a short “Cypher decision” note: not integrated; Supabase remains issuer; reevaluation criteria are multiple downstream services and complete OIDC compatibility.
- [ ] Verify all referenced files and commands exist.
- [ ] Commit with `docs: align security and database documentation`.

### Task 14: Final verification and review gate

**Files:**

- Modify no production files unless a verification failure has a reproduced root cause and a focused test.

**Interfaces:**

- Consumes: completed branch.
- Produces: evidence-backed handoff without remote side effects.

- [ ] Run from `web/`: `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm audit --omit=dev`, and `npm audit`.
- [ ] Run from repository root: `git diff --check`, `git status --short`, `git log --oneline main..HEAD`, and `git diff --stat main...HEAD`.
- [ ] Run secret-pattern scans over the current tree and all commits newly created on the branch. Redact any discovered value from the report.
- [ ] Review every SQL function for execution grants, `search_path`, invoker/definer choice, transactional failure behavior, and schema-qualified object access.
- [ ] Review every RLS policy against this access matrix:

| Resource | anon | authenticated non-admin | admin |
|---|---|---|---|
| Active products/categories/site config/sizes | read | read | read |
| Visible variants of active products | read | read | read |
| Inactive products/invisible variants | deny | deny | read |
| Product/category/variant/config writes | deny | deny | allowed as specified |
| Sales history | deny | deny | insert/read only |
| Product image writes | deny | deny | allowed validated types only |

- [ ] Confirm no command contacted or mutated production Supabase, Vercel, GitHub, or Cypher.
- [ ] Produce a final report listing commits, files changed, tests and exact results, remaining warnings, unapplied migration rollout steps, and any scope deliberately deferred.
- [ ] Do not merge, push, deploy, apply SQL remotely, rotate credentials, or delete this temporary plan without explicit user authorization.

## Stop Conditions

Stop and report instead of guessing when:

- The starting working tree contains anything other than this untracked temporary plan.
- The deployed database schema is required to decide a migration but cannot be obtained read-only.
- Existing rows violate a new constraint.
- The existing administrator cannot be assigned `app_metadata.role = admin` before rollout.
- A required dependency fix needs a major framework upgrade.
- A test exposes a behavior conflict not resolved by this document.
- Any step would require production credentials, remote writes, destructive data repair, history rewriting, or integration with Cypher.

## Definition of Done

The implementation is complete only when all mandatory checkboxes are satisfied, the branch contains the required migration/runbook/tests, build and tests pass, ESLint has zero errors, production dependency audit has zero high/critical findings, all database mutations enforce a real admin role, no remote state was changed, and the final report explicitly identifies the migration as prepared but unapplied.
