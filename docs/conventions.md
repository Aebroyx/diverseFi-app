# Engineering Conventions

> **HOW we build it** — engineering principles, layering, patterns, and code
> conventions all new work must follow. The engineering counterpart to
> `design_language.md` (visual HOW). Pairs with `system_spec.md` (WHAT) and
> `architecture.md` (AS-IS). Update this file when a convention changes.

**Last updated:** 2026-06-22

---

## 1. Principles

- **Spec-Driven Development (SDD):** every change traces to a spec in `specs/`.
  Read `system_spec.md` → `conventions.md` → `design_language.md` →
  `architecture.md` → the active spec before coding.
- **Extreme Programming (XP):** small, testable increments; each step leaves the
  system buildable. Prefer the simplest design that satisfies the spec.
- **Clean Code & Separation of Concerns:** thin transport layer, business logic in
  services, persistence in models. No business rules in handlers or React pages.
- **Small, reusable units:** focused Go packages and React components; prefer
  composition and adapters over rewrites.
- **Don't guess the API:** clients use documented endpoints (`architecture.md` §2.4).

## 2. Backend (`diverseFI-api`)

### 2.1 Layering (strict, one-direction)

```
routes → middleware → handler → service → model → GORM/PostgreSQL
```

- **routes/** — register endpoints + attach middleware. No logic.
- **handlers/** — bind & validate input, read auth context, map results to HTTP via
  the common response envelope. Thin; one service call where possible.
- **services/** — business logic, GORM queries, external integrations (Resend).
  Hold `*gorm.DB` + `*config.Config`; may compose other services.
- **domain/models/** — GORM entities and request/response DTOs. No I/O.
- **middleware/** — cross-cutting only (auth, permission, audit, correlation, rate limit).

### 2.2 Conventions

- **Responses:** always use `internal/common` (`SendSuccess` / `SendError`) for a
  uniform envelope and error codes. No ad-hoc JSON shapes.
- **Validation:** struct tags + `go-playground/validator`; register custom rules in
  `internal/validators` (e.g. password policy). Validate in the handler.
- **Errors:** services return errors; handlers translate to HTTP. Never panic for
  control flow (Recovery middleware is a safety net, not a strategy).
- **Config:** all tunables via `internal/config` (env-driven). No hardcoded secrets,
  ports, or origins. Validate required env at startup.
- **Logging:** use `internal/logger` (structured); include correlation id in audit.
- **Pagination:** list endpoints use `internal/pagination` (search/filter/sort).

### 2.3 AuthN / AuthZ

- **AuthN:** JWT (HS256) in HttpOnly `access_token` cookie; opaque rotating
  `refresh_token`. Middleware loads the user (+role) into context.
- **AuthZ (RBAC):** map method+path → menu path + CRUD permission in
  `internal/config/permissions.go`; the `Permission` middleware enforces it.
  **New protected routes that need gating must be added to `RoutePermissions`** —
  unmapped routes are allowed for any authenticated user (document the intent).
- **Effective permission order:** role-menu → user-menu → rights-access override
  (`nil` inherits).

### 2.4 Persistence & migrations

- **GORM AutoMigrate** in dependency (FK) order, plus seeders, gated by
  `DB_AUTO_MIGRATE`. New models are added to the ordered migration list.
- Soft-delete core entities; audit logs are immutable.

### 2.5 Add a backend feature (recipe)

1. Model/DTO in `domain/models/` (+ add to migration order if new table).
2. Service method(s) in `services/`.
3. Handler in `handlers/` (bind, validate, call service, `common.Send*`).
4. Route in `routes/` + register in router; add to `RoutePermissions` if gated.
5. Audit/rate-limit are automatic via middleware; add correlation-aware logs.

## 3. Frontend (`diverseFI-web`)

### 3.1 Structure & data flow

```
Page (App Router) → feature hook (React Query) → service (axios) → Go API
                  ↘ Redux (auth/user) · PermissionContext (RBAC) for UI gating
```

- Authenticated pages live under the `(protected)` route group; its layout applies
  the navigation shell + `RequireMenuRead` gate.
- **Providers** (root layout, outer→inner): React Query → Redux → Auth → Permission
  → Theme → Toaster.

### 3.2 Conventions

- **Server calls go through `src/services/*`** using the shared axios instance
  (`withCredentials`, 401→refresh interceptor). Never call axios directly with
  hardcoded URLs; use base `NEXT_PUBLIC_API_URL`.
- **Data fetching/mutations via `src/hooks/use*`** (React Query). Keep cache keys
  consistent; invalidate on mutation.
- **State:** Redux holds auth/session/user only; component/UI state stays local.
  RBAC flags come from `PermissionContext` / `usePermission`, not ad-hoc fetches.
- **RBAC gating layers:** route (`RequireMenuRead`) → action (`usePermission`
  hide/disable) → navigation (Sidebar filtering). Apply all three.
- **Types:** colocate in `src/types/`; mirror API DTOs. Path alias `@/*` → `src/*`.
- **UI/styling:** follow `design_language.md` — shadcn/ui pulled via CLI, themed
  with Tailwind semantic tokens, dark-first. Don't duplicate visual rules here.

### 3.3 Add a frontend feature (recipe)

1. Types in `src/types/`; service in `src/services/` (shared axios).
2. Hook(s) in `src/hooks/` (React Query) with stable cache keys.
3. Page under `(protected)/<feature>/` using shared UI components.
4. Gate with `RequireMenuRead` (route) + `usePermission` (actions); add Sidebar menu.

## 4. Cross-Cutting

- **Env management:** both apps require `.env`; keep `.env.example` in sync. Web
  `NEXT_PUBLIC_API_URL` must match the API origin/port and CORS allow-list.
- **Naming:** Go — idiomatic packages, `PascalCase` exports; React — `PascalCase`
  components, `useX` hooks, kebab-case routes. Specs: `SPEC-00N-<slug>.md`.
- **Definition of done:** builds + lints clean; spec statuses updated; changelog
  appended; manual smoke test of affected flows.
