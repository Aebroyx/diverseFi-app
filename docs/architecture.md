# DiverseFi — Architecture Baseline

> **As-is** record of the current codebase state. Part of the docs set:
> `system_spec.md` (what the system is) · `conventions.md` (how we build) ·
> `design_language.md` (how the UI looks) · `architecture.md` (this — current
> implementation) · `specs/` (per-feature work).
> Read the system docs + the active spec before generating new code; update this
> file whenever the implementation changes.

**Last assessed:** 2026-06-30
**Repository layout:** monorepo — `diverseFI-api/` (Go/Gin backend) · `diverseFI-web/` (Next.js frontend).

> ⚠️ **Domain context:** The current codebase is a production SaaS **boilerplate
> baseline** (users, roles, menus, RBAC, audit logs, email templates). The product
> — DiverseFi, an **invite-only, multi-tenant** multi-asset investment aggregator —
> is built **on top of** this foundation, and its enterprise features are
> **retained and leveraged** (RBAC gates menus/modules/CRUD; audit logging kept).
> Do not strip these. New per-user domain data (`assets`, `portfolio_snapshots`) is
> tenant-scoped; market data (`price_feeds`) is shared. See `system_spec.md` for the
> target domain and `specs/` for what is actively changing.

---

## 1. High-Level Overview (Boilerplate Baseline)

The current codebase is a full-stack RBAC administration shell (user / role / menu
management with fine-grained permissions, audit logging, transactional email,
global search, and Excel import/export).

```
Browser
  → Next.js 16 (App Router, React 19, Redux Toolkit, React Query)
      ↳ axios (withCredentials) → cookie-based JWT
  → Go 1.24 / Gin REST API  (prefix: /api, no version segment)
      ↳ GORM → PostgreSQL
      ↳ Resend (transactional email)
```

- **Auth:** HttpOnly cookies (`access_token` JWT + opaque `refresh_token`).
- **RBAC:** role → menu permissions, with optional per-user overrides, enforced
  on the backend (menu-path mapping) and mirrored on the frontend (UI gating).
- **No API versioning**, **no SQL migration files** (GORM AutoMigrate + seeders),
  **no graceful shutdown** yet.

---

## 2. Backend — `diverseFI-api/`

- **Module:** `github.com/Aebroyx/diverseFi-api`
- **Go:** 1.24.0 (toolchain 1.24.12)
- **Framework:** Gin v1.10.1 (`gin.New()`, explicit middleware)
- **ORM/DB:** GORM v1.30.0 + `gorm.io/driver/postgres` v1.6.0 (pgx v5 under the hood)
- **Dev:** Air hot-reload (`.air.toml` → `go build` → `./tmp/main`)

### 2.1 Directory layout

```
diverseFI-api/
├── cmd/main.go                 # Entry point: load config → connect DB → wire deps → run
├── internal/
│   ├── common/response.go      # Uniform JSON envelope (SendSuccess / SendError)
│   ├── config/
│   │   ├── config.go           # godotenv loading, validation, DSN/addr helpers
│   │   └── permissions.go      # Route→menu RBAC map + whitelist
│   ├── database/
│   │   ├── db.go               # GORM PostgreSQL connection
│   │   ├── migration.go        # Ordered AutoMigrate + inline role seeding
│   │   └── seeders.go          # Default menus, role-menus, root user
│   ├── domain/models/          # GORM entities + DTOs (13 files)
│   ├── handlers/               # Thin HTTP layer (13 files)
│   ├── logger/logger.go        # Structured JSON/text logging
│   ├── middleware/             # auth, audit, correlation, permission, rate_limit
│   ├── pagination/pagination.go# Generic GORM paginator (search/filter/sort)
│   ├── routes/                 # Gin route registration (14 files)
│   ├── services/               # Business logic (14 files)
│   └── validators/password.go  # Custom password validator
├── go.mod / go.sum
└── .env / .env.example / .air.toml
```

> **Note:** `migrations/` exists but is empty — schema is managed by GORM
> AutoMigrate in `internal/database/migration.go`, not SQL files.

### 2.2 Startup sequence (`cmd/main.go`)

1. `config.Load()` — reads `.env` via godotenv (**fails if `.env` missing**).
2. Validate required: `JWT_SECRET`, `DB_PASSWORD`.
3. `logger.Init(...)` — JSON output when `APP_ENV=production`.
4. `database.NewConnection(cfg)` — open GORM/PostgreSQL.
5. `db.Initialize(cfg)` — AutoMigrate + seeders when `DB_AUTO_MIGRATE=true`.
6. Wire 14 services + 13 handlers → `routes.SetupRouter`.
7. `router.Run(cfg.GetServerAddr())` — default `localhost:8080`.

**Global middleware chain:** `gin.Logger` → `gin.Recovery` → `CorrelationID` → CORS.

**Route groups:**
- Public `/api/auth/*` — `RateLimitByIP`.
- Protected `/api/*` — `Auth` → `RateLimitByUser` → `Permission` → `AuditLogger`.

### 2.3 Database & models

**Migration order** (`migration.go`, when `DB_AUTO_MIGRATE=true`):
`roles, menus` → seed roles (`root`/`admin`/`user`) → backfill users →
`users` → `role_menus, user_menus, rights_access` →
`refresh_tokens, audit_logs` → `email_templates, email_logs`.

**Seeders** (`seeders.go`): default menus (Dashboard + Configurations tree),
default role-menu CRUD flags, and root user **`root` / `P@ssw0rd`**.

**Models** (`internal/domain/models/`):

| File | Struct(s) | Description |
|---|---|---|
| `users.go` | `Users`, `Claims`, auth DTOs | User entity (role FK, soft delete) + JWT claims |
| `role.go` | `Role` | Named role with display metadata, default/active flags |
| `menu.go` | `Menu`, `MenuWithPermissions`, `EffectivePermissions` | Hierarchical nav + RBAC UI shapes |
| `role_menu.go` | `RoleMenu` | Role↔menu pivot with CRUD flags |
| `user_menu.go` | `UserMenu` | Direct user↔menu grant |
| `rights_access.go` | `RightsAccess` | Per-user per-menu override (`*bool`, nil = inherit) |
| `refresh_token.go` | `RefreshToken` | Opaque DB refresh token w/ rotation/revocation |
| `audit_log.go` | `AuditLog` | Immutable audit trail |
| `email.go` | `EmailTemplate`, `EmailLog` | Template + sent-email tracking (Resend) |
| `search.go` | `SearchUser/Role/Menu`, `GlobalSearchResponse` | Search DTOs (no tables) |
| `user_import.go` / `role_import.go` / `menu_import.go` | import/export DTOs | Excel rows + bulk requests |

### 2.4 API endpoints (prefix `/api`)

Public = no auth. Protected = auth + rate limit + permission + audit.

**Auth/tokens**
- `POST /auth/register` *(public)* — `AuthHandler.Register`
- `POST /auth/login` *(public)* — `AuthHandler.Login`
- `POST /auth/refresh-token` *(public)* — `TokenHandler.RefreshToken`
- `GET /me` — `AuthHandler.GetMe`
- `POST /auth/logout` — `AuthHandler.Logout`
- `POST /auth/revoke-token` — `TokenHandler.RevokeToken`
- `POST /auth/revoke-all-tokens` — `TokenHandler.RevokeAllTokens`
- `GET /auth/tokens` — `TokenHandler.GetActiveTokens`

**Users**
- `GET /users` · `GET /user/:id` · `POST /user/create` · `PUT /user/:id` ·
  `DELETE /user/:id` · `POST /user/reset-password/:id`
- Import: `GET /users/export` · `GET /users/template` ·
  `POST /users/import/validate` · `POST /users/import`

**Roles**
- `GET /roles` · `GET /roles/active` · `GET /role/:id` · `POST /role/create` ·
  `PUT /role/:id` · `DELETE /role/:id`
- `GET /role/:id/menus` · `POST /role/:id/menus` · `DELETE /role/:id/menus/:menuId`
- Import: `GET /roles/export` · `GET /roles/template` ·
  `POST /roles/import/validate` · `POST /roles/import`

**Menus**
- `GET /menus` · `GET /menus/tree` · `GET /menus/user` · `GET /menu/:id` ·
  `POST /menu/create` · `PUT /menu/:id` · `DELETE /menu/:id`
- Import: `GET /menus/export` · `GET /menus/template` ·
  `POST /menus/import/validate` · `POST /menus/import`

**Rights access**
- `GET /rights-access/user/:userId` · `GET /rights-access/user/:userId/menu/:menuId` ·
  `POST /rights-access` · `POST /rights-access/user/:userId/bulk` ·
  `DELETE /rights-access/user/:userId` · `DELETE /rights-access/:id`

**Audit**
- `GET /audit/logs` · `GET /audit/logs/user/:userId` ·
  `GET /audit/logs/:resourceType/:resourceId`

**Email & templates**
- `POST /email/send` · `POST /email/send-test` · `GET /email/logs` · `GET /email/log/:id`
- `GET /email-templates` · `GET /email-templates/categories` · `GET /email-template/:id` ·
  `POST /email-template/create` · `PUT /email-template/:id` · `DELETE /email-template/:id`

**Search**
- `GET /search/global` — `SearchHandler.GlobalSearch`

> **Total: 63 endpoints** (3 public, 60 protected).

### 2.5 Middleware

| Middleware | Behavior |
|---|---|
| `CorrelationID` | Reads/generates `X-Correlation-ID`, echoes in response |
| `Auth` | Validates `access_token` HttpOnly cookie (HS256 + `JWT_SECRET`), loads user+role into ctx |
| `Permission` | Maps method+path → menu path + CRUD perm via `config.RoutePermissions`; 403 on deny |
| `AuditLogger` | Logs POST/PUT/DELETE (passwords redacted) to `audit_logs` on 2xx, async |
| `RateLimitByIP` / `RateLimitByUser` | In-memory sliding window; `X-RateLimit-*` + 429 |

### 2.6 Layering pattern

`Router → Middleware → Handler (bind/validate, status codes) → Service
(business logic, GORM, external APIs) → Model → PostgreSQL`. Handlers are thin;
services hold `*gorm.DB` + `*config.Config` and may compose other services.

### 2.7 Auth / RBAC model

- **Access token:** JWT HS256, claims `user_id, username, email, role_id, role_name`,
  issuer `diversefi-api`, expiry `JWT_EXPIRY` (default 24h).
- **Refresh token:** opaque, stored in `refresh_tokens`, rotated on refresh,
  revocable individually or globally; expiry `REFRESH_TOKEN_EXPIRY` (default 168h).
- **Delivery:** HttpOnly cookies; login response body returns user only.
- **Password:** bcrypt; policy min 8 chars + 1 upper + 1 number + 1 special.
- **RBAC resolution (3 layers):** role menus (base) → user menus (direct grant) →
  rights access (per-user override; nil inherits). Effective perms keyed by **menu path**
  (e.g. `/users-management`) with `read/write/update/delete`.
- **Whitelisted (any authed user):** `GET /me`, `POST /auth/logout`,
  `GET /menus/user`, `GET /menus/tree`, `GET /roles/active`.
- **Coverage gap:** routes absent from `RoutePermissions` (audit, email, search,
  imports, role-menu assignment, password reset) are allowed for any authenticated user.

### 2.8 Required env (`.env`)

Required: `JWT_SECRET`, `DB_PASSWORD`. Notable defaults: `SERVER_PORT=8080`,
`DB_NAME=diversefi_db`, `DB_AUTO_MIGRATE=true`, `JWT_EXPIRY=24h`,
`REFRESH_TOKEN_EXPIRY=168h`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`,
rate-limit + Resend email vars.

### 2.9 Key dependencies

Gin v1.10.1 · GORM v1.30.0 (+ postgres v1.6.0 / pgx v5.7.5) ·
golang-jwt/jwt v5.2.2 · go-playground/validator v10.26.0 · godotenv v1.5.1 ·
google/uuid v1.6.0 · x/crypto v0.43.0 · resend-go v2.28.0 · excelize v2.10.0.

---

## 3. Frontend — `diverseFI-web/`

- **Next.js** 16.1.6 (App Router) · **React** 19.2.4 · **TypeScript** 5
- **Tailwind CSS** 4.3.2 (CSS-first — `@import "tailwindcss"`, `@theme inline` in
  `globals.css`; **no** `tailwind.config.ts`). Class-based dark via
  `@custom-variant dark (&:where(.dark, .dark *));` + `next-themes`.
- **State:** Redux Toolkit + react-redux · **Data:** TanStack React Query + axios
- **Tables:** TanStack React Table · **Excel:** exceljs · **Toasts:** react-hot-toast
- **UI:** shadcn/ui v4 (CLI-generated in `src/components/ui/shadcn/`), `@base-ui/react`,
  `react-select`, `cmdk`, `lucide-react`, `next-themes`; `@heroicons/react` still used in some
  legacy pages (phasing out). **Removed:** `@headlessui/react`.
- **Path alias:** `@/*` → `./src/*`

### 3.1 App Router structure

```
src/app/
├── layout.tsx                 # Root: fonts + providers + Toaster + pre-paint theme script
├── page.tsx                   # / (renders Navigation directly — outside (protected))
├── globals.css                # HSL design tokens + Tailwind v4 @theme inline
├── auth/login/page.tsx        # /auth/login   (raw HTML inputs)
├── auth/register/page.tsx     # /auth/register
├── api/auth/logout/route.ts   # POST /api/auth/logout (clears cookies)
└── (protected)/               # route group (no URL segment)
    ├── layout.tsx             # Navigation shell + RequireMenuRead RBAC gate
    ├── dashboard/page.tsx     # /dashboard
    ├── users-management/{page,add,[id]}
    ├── roles-management/{page,add,[id]}
    ├── menus-management/{page,add,[id]}
    ├── email-logs/page.tsx
    └── audit-logs/page.tsx
```

**Provider nesting (root layout):** `QueryProvider` → Redux `Provider` →
`AuthProvider` → `PermissionProvider` → `ThemeProvider` → `<Toaster>`.

> **Anomaly:** `/` (`src/app/page.tsx`) lives outside `(protected)` and renders
> `Navigation` without `RequireMenuRead`; `/dashboard` duplicates placeholder content.

### 3.2 Styling system & brand color

- **Tailwind v4** maps semantic colors via `@theme inline` in `globals.css`
  (`background`, `foreground`, `primary`, `card`, `muted`, `accent`, `border`,
  `input`, `ring`, …). Legacy aliases (`--card-bg`, `--input-bg`, `--hover-bg`)
  remain for a few unmigrated consumers (`DataTable`, `Sidebar` partial).
- **Dark mode:** `next-themes` (`attribute="class"`, `defaultTheme="dark"`,
  `storageKey="theme"`, `enableSystem`). Pre-paint script in `layout.tsx` sets
  `.dark` before first paint. **`@custom-variant dark`** binds Tailwind `dark:`
  to the class toggle (not OS `prefers-color-scheme`).
- **Tokens:** HSL CSS variables in `globals.css`. Dark surfaces use neutral
  Discord-like grays; see `design_language.md` §2.2 for authoritative values.

**BRAND / PRIMARY COLOR (authoritative — preserve):**

| Token | Hex | HSL |
|---|---|---|
| **`--primary`** | **`#8A73F9`** | **`252 92% 71%`** |
| `--primary-light` | `#BFA7FF` | `255 100% 83%` |
| `--primary-dark` | `#5F4AD3` | `249 58% 56%` |
| `--secondary` (lime accent) | `#E2F973` | `73 91% 71%` |

Dark surfaces (mapped to semantic tokens): `--background ~#2b2d31`,
`--card ~#313338`, `--input ~#1e1f22`, `--muted/--accent ~neutral slate`.

### 3.3 Component inventory

**Layout/shell:** `Navigation`, `Sidebar` (API-driven menus; mobile → shadcn `Sheet`),
`TopNav` (shadcn `DropdownMenu`, search trigger, logout), `Providers`,
`ThemeProvider` (`next-themes`), `ThemeToggle`, `CommandPalette` (shadcn `Command`),
`auth/RequireMenuRead`.

**shadcn primitives — `src/components/ui/shadcn/`** (CLI-generated; customize via
tokens/Tailwind after pull): `button`, `input`, `label`, `textarea`, `switch`,
`badge`, `card`, `dialog`, `alert-dialog`, `popover`, `dropdown-menu`, `select`,
`table`, `command`, `sheet`, …

**Adapters/wrappers — `src/components/ui/`** (preserve existing prop APIs):

| Component | Notes |
|---|---|
| `Input.tsx` (`Input`,`Textarea`,`Toggle`) | Wraps shadcn `Input`/`Textarea`/`Switch` + `Label` |
| `Select.tsx` | **`react-select`** adapter (same props API); styled to match shadcn `Input` via CSS vars; portal menu. shadcn `select` in `ui/shadcn/` is unused. |
| `buttons/PrimaryButton`, `SecondaryButton` | shadcn `Button` |
| `PrimaryBadge`, `SecondaryBadge` | shadcn `Badge` + variant map |
| `FormCard.tsx` (`FormSection`,`FormRow`,`FormActions`) | shadcn `Card*`; footer actions right-aligned |
| `Table.tsx` | shadcn `Table` primitives |

**Modals (`src/components/modals/`):** `DeleteModal` → `AlertDialog`;
`FilterModal` → `Popover`; `AdvancedFilterModal`, `ProfileModal`, `SettingsModal`,
import wizards → `Dialog`.

**Feature/data:** `MasterTable` (legacy CRUD table), `DataTable/*` (TanStack,
server-side pagination — preferred; **still uses legacy `gray-*` classes**),
`MenuPermissionsEditor`, `RoleMenuPermissionsEditor`, and
`users|roles|menus/*` import/export wizards.

### 3.4 Services, hooks & API integration

- **axios** (`src/lib/axios.ts`): base `NEXT_PUBLIC_API_URL` (`http://localhost:8080/api`
  fallback; `.env` uses `:8088/api`), `withCredentials: true`; 401 interceptor →
  `POST /auth/refresh-token` retry queue → redirect `/auth/login` on failure.
- **proxy** (`src/proxy.ts`): Next 16 middleware-replacement for route protection
  (public `/auth/*`, checks `access_token` cookie). **No `src/middleware.ts`
  exists and nothing imports `proxy.ts` — server-side gating may be inactive; verify.**
- **Services:** `userService`, `userImportService`, `roleService`,
  `roleImportService`, `menuService`, `menuImportService`, `auditService`,
  `emailService`, `searchService`.
- **Hooks:** `useAuth`, `useUser`, `useRole`, `useMenu` (+`useGetUserMenus`),
  `usePermission`, `use*Import`, `useAuditLogs`, `useEmailLogs`, `useGlobalSearch`,
  `useDebounce`.

### 3.5 State & auth/RBAC (frontend)

- **Redux** (`src/store/`): `authSlice` `{user}` with `setCredentials`/`logout`;
  legacy `counterSlice` (demo).
- **AuthProvider**: React Query `['me']` → fetch `/me` → dispatch to Redux.
- **PermissionContext**: fetches user menu tree → `Map<path, EffectivePermissions>`;
  exposes `getMenuPermissions(path)`. Flags `can_read/write/update/delete`.
- **RBAC gating layers:** `RequireMenuRead` (route read gate) → `usePermission()`
  (per-action hide/disable) → Sidebar (menu filtering).
- **Legacy duplication to ignore/remove later:** `src/app/ClientProvider.tsx`,
  `src/lib/store.ts`, `Counter.tsx`.

---

## 4. Known Gaps / Watch-outs

1. Backend: no API versioning, no graceful shutdown, GORM AutoMigrate only,
   in-memory rate limiting (single-instance), partial RBAC route coverage.
2. Frontend: `/` route outside `(protected)`; `proxy.ts` possibly unwired;
   dual table systems (`MasterTable` legacy vs `DataTable`); `DataTable`/`Sidebar`
   still mix legacy `gray-*` + `dark:` with semantic tokens; no form library;
   Heroicons not fully migrated to Lucide.
3. `.env` files required for both apps; web `.env` points API at `:8088`,
   axios fallback uses `:8080` — keep consistent.

---

## 5. UI stack (post SPEC-001)

shadcn/ui v4 is initialized (`components.json`, CLI output in `ui/shadcn/`).
**Default dark mode** via `next-themes`; **Slate + brand primary** (`#8A73F9`) in
`globals.css`. Primitives, modals, Sidebar mobile sheet, and Command palette
migrated. **`Select.tsx` stays on `react-select`** (shadcn Select tried and reverted).
Remaining cleanup: migrate `DataTable`/`Sidebar` off legacy `gray-*` classes,
finish Heroicons → Lucide, remove legacy CSS alias vars when unused.
See `specs/SPEC-001-shadcn-ui-migration.md` for requirement status.
