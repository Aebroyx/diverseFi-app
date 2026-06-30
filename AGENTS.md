# AGENTS.md — DiverseFi

Entrypoint for AI agents and contributors. **Read this first.** This repo uses
**Spec-Driven Development (SDD)** with **Extreme Programming (XP)** and Clean Code.

## What this is

DiverseFi is an **invite-only, multi-tenant Multi-Asset Investment Aggregator** for
a closed circle of users. It bridges Web2 brokerages (Indonesian equities, US
indices) and Web3 portfolios (crypto, Polymarket prediction markets) into a
unified, per-user live Net Asset Value (NAV) view.

It is built on a **production SaaS boilerplate whose enterprise features we keep
and leverage**: cookie-based auth, **RBAC** (to gate menus/modules/CRUD per role),
**audit logging**, and admin interfaces. There are **no billing/subscriptions** and
**no public registration** (access is invite-only/admin-provisioned).

**Multi-tenancy:** each user is a tenant. `assets` and `portfolio_snapshots` are
**per-user** (scoped by authenticated user id); `price_feeds` is **shared
system-wide** to save external API calls.

Monorepo, two apps:

- **`diverseFI-api/`** — Go 1.24 / Gin REST API + PostgreSQL (GORM). Auth, RBAC,
  audit, plus the Asset Ledger and shared Market Feed (Yahoo Finance, Alpha
  Vantage, CoinGecko, Polymarket CLOB).
- **`diverseFI-web/`** — Next.js 16 (App Router) / React 19 / Tailwind v4 dashboard.
  Redux + React Query + axios. **shadcn/ui** (dark-mode default) + `react-select` for Select.

> ⚠️ The current codebase is a SaaS **boilerplate baseline**. We **build the
> investment-aggregator domain on top of it and preserve its enterprise features**
> (RBAC, audit, admin) — do not strip them. Consult `docs/architecture.md` for the
> AS-IS state and `docs/specs/` for what is being added/changed.

## The docs are the source of truth (`docs/`)

**Before writing or changing any code, read in this order:**

1. `docs/system_spec.md` — **WHAT** DiverseFi is (domain, asset types, capabilities, glossary).
2. `docs/conventions.md` — **HOW we build** (layering, patterns, engineering recipes).
3. `docs/design_language.md` — **HOW the UI looks** (dark-first, brand accent, shadcn + Tailwind).
4. `docs/architecture.md` — **AS-IS** boilerplate codebase (structure, all endpoints, auth).
5. `docs/specs/` — **CURRENT WORK.** Read `docs/specs/README.md`, then the active
   spec (status `IN PROGRESS`).

## Working agreement (SDD + XP)

- **Every change traces to a spec.** New work → create `docs/specs/SPEC-00N-<slug>.md`.
- **Update the spec as you go:** flip statuses, log decisions, append changelog.
- **Small, testable increments;** keep the system buildable at every step.
- **Definition of done:** builds + lints clean, spec updated, smoke test passed.

## Hard rules

- **Don't invent API endpoints** — use `docs/architecture.md` §2.4 for existing,
  and `docs/system_spec.md` for what's planned.
- **Preserve the enterprise SaaS features** (auth, RBAC, audit, admin) — don't
  strip them; leverage RBAC to gate menus/modules/CRUD.
- **No billing/subscriptions; no public registration** (invite-only) — see
  `docs/system_spec.md` §10 Out of Scope.
- **Enforce multi-tenancy:** per-user data (`assets`, `portfolio_snapshots`) MUST
  be scoped by the authenticated user id at the service layer; `price_feeds` is
  shared. A user must never access another user's ledger.
- **Separation of concerns** — backend: `routes → handler → service → model`; no
  business logic in handlers/pages.
- **shadcn/ui components are pulled via the CLI** (`npx shadcn@latest add <component>`),
  never hand-written; customize via Tailwind tokens after generation.
- **Style with semantic tokens, not raw hex.** Dark-first; brand purple
  `#8A73F9` (`252 92% 71%`) is the accent. See `docs/design_language.md`.
- **DECIMAL for all financial quantities and prices** — never `float` or `double`.
- **JSONB for unpredictable metadata** (Web3 contract data, Polymarket responses).
- **External API calls are best-effort** — always handle failures gracefully; show
  stale-price warnings rather than crashing.
- **Config via env** — no hardcoded secrets/keys/URLs. `.env` required per app;
  keep `.env.example` in sync.
- **Stop and ask** before changing auth, migrations, DataTable, or price-feed logic.

## Run / build

**API** (`diverseFI-api/`): requires `.env` (`JWT_SECRET`, `DB_PASSWORD` mandatory).
- Dev (hot reload): `air` · Build: `go build ./...` · Default addr `localhost:8080`.

**Web** (`diverseFI-web/`): requires `.env` (`NEXT_PUBLIC_API_URL`).
- Dev: `npm run dev` (port 3000) · Build: `npm run build` · Lint: `npm run lint`.

## Default credentials (seeded, dev)

`root` / `P@ssw0rd` — seeded by boilerplate when `DB_AUTO_MIGRATE=true`.
