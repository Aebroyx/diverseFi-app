# System Specification

> **WHAT the system is** — the authoritative domain specification of DiverseFi.
> This document is stable and changes only when the product vision changes.
> For *how we build it* see `conventions.md`; for *how the UI looks* see
> `design_language.md`; for the *current codebase* see `architecture.md`;
> for *current work* see `specs/`.

**Last updated:** 2026-06-22

---

## 1. Purpose & Vision

**DiverseFi** is an **invite-only, multi-tenant Multi-Asset Investment Aggregator**
for a closed circle of users. It bridges the gap between traditional localized Web2
brokerages and decentralized Web3 portfolios, giving each user a unified, live
Net Asset Value (NAV) view across fragmented holdings.

The core problem it solves: a modern investor's holdings are fragmented across
systems that do not talk to each other — local stock brokers (Growin, Mandiri),
US index platforms (Pluang), crypto exchanges (Pintu), self-custody wallets, and
on-chain prediction markets (Polymarket). None share a common data model.
DiverseFi unifies them per user into one portfolio dashboard.

### Built on a production SaaS boilerplate (features retained)

DiverseFi is built on top of a production-grade SaaS boilerplate, and we
**intentionally keep its enterprise features** because they map directly onto our
needs:

- **Authentication & sessions** — cookie-based JWT + refresh-token rotation.
- **Role-Based Access Control (RBAC)** — used to gate **menus, modules, and CRUD
  access** per user/role (e.g. locking experimental Web3 features behind a role).
- **Audit logging** — useful operational/security history; kept intact.
- **Admin interfaces** — user/role/menu management for the closed user circle.

**What it is NOT:** there are no subscription tiers, no SaaS billing, and no
payment integrations (no Stripe). Access is **invite-only** (admin-provisioned),
not open self-service signup.

---

## 2. Multi-Tenancy Model

DiverseFi is **strictly multi-tenant**, where **each user is a tenant**:

| Data | Tenancy | Rationale |
|---|---|---|
| `assets` (Asset Ledger) | **Per-user** (tightly coupled to authenticated user) | Each user's holdings are private to them |
| `portfolio_snapshots` | **Per-user** | NAV history is private to each user |
| `price_feeds` (Market Feed) | **Shared system-wide** | Market prices are universal; sharing saves external API calls and rate limits |
| Auth / RBAC / audit (boilerplate) | Platform-level | Manage the closed circle of users and their permissions |

**Isolation rule:** every query against per-user data MUST be scoped by the
authenticated user's ID at the service/repository layer. Tenant isolation is
enforced in code (not relied on solely from the client). See `conventions.md`.

---

## 3. Architecture Paradigm: Decoupled Ledger + Market Feed

```
Asset Ledger  (what a user owns)   ←→   Market Feed  (what it is worth)
─────────────────────────────────────────────────────────────────────────
Per-user, stored in PostgreSQL          Shared cache, fetched from external APIs
Exact quantities, DECIMAL precision     Cached in price_feeds (system-wide)
Manually entered or imported            Scheduled / on-demand refresh
```

The **NAV** for a holding is `quantity × latest_shared_price`. A user's portfolio
NAV is the sum across their holdings. The ledger stores quantities (per user); the
feed service supplies current market prices (shared by all users).

---

## 4. Asset Classes

Three distinct asset types, each with its own price-feed source:

### 4.1 Web2 Traditional Equities

| Sub-type | Examples | Price source |
|---|---|---|
| Indonesian equities (`stock_id`) | BBCA.JK, TLKM.JK via Growin / Mandiri Sekuritas | Yahoo Finance / Alpha Vantage |
| US indices & funds (`stock_us`) | SPY, QQQ via Pluang | Yahoo Finance / Alpha Vantage |

Brokers provide no API; users enter exact share quantities manually. The Go
backend fetches live ticker prices (shared feed).

### 4.2 Web3 Native Crypto

| Sub-type | Examples | Price source |
|---|---|---|
| Centralized exchange (`crypto_cex`) | BTC, ETH, altcoins via Pintu | CoinGecko |
| Self-custody wallet (`crypto_wallet`) | On-chain balances | CoinGecko + public RPC |

`metadata` JSONB stores chain, contract address, wallet address if applicable.

### 4.3 Decentralized Prediction Markets (Polymarket)

| Sub-type | Description | Price source |
|---|---|---|
| `polymarket` | On-chain ERC-1155 outcome token positions | Polymarket CLOB API (public) |

`metadata` JSONB stores `market_id`, `condition_id`, `outcome_index`, `token_id`,
`question`. **Often an RBAC-gated experimental module** (see §6).

---

## 5. Functional Capabilities

| # | Capability | Description |
|---|---|---|
| C1 | **Authentication & sessions** | Cookie-based JWT + refresh rotation (boilerplate). Invite-only; no public registration in production. |
| C2 | **RBAC & admin** | Roles, menus, and per-user/role permission management; gate modules + CRUD. Admin provisions users. |
| C3 | **Audit logging** | Mutating actions recorded with correlation id (boilerplate). |
| C4 | **Asset Ledger — CRUD** | Per-user create/read/update/delete positions (all asset types). Manual entry + bulk import. |
| C5 | **Price Feed — Fetch & Cache** | Shared fetch from Yahoo / Alpha Vantage / CoinGecko / Polymarket CLOB; cached in `price_feeds`. |
| C6 | **NAV Calculation** | Per-user NAV (`quantity × shared latest_price`) + total portfolio NAV with currency conversion. |
| C7 | **Portfolio Dashboard** | Per-user aggregate view: total NAV, allocation %, P&L vs cost basis, asset-type breakdown. |
| C8 | **Price Feed Refresh** | Manual trigger + scheduled polling, configurable per source. |
| C9 | **Multi-currency** | Normalize NAVs to a base currency (USD default); store exchange rates. |
| C10 | **Historical Snapshots** (future) | Per-user periodic NAV snapshots for charting. |
| C11 | **Import / Export** | Bulk position import via CSV/Excel; export for records. |

---

## 6. RBAC Usage (module / menu / CRUD gating)

We reuse the boilerplate's menu-path RBAC to gate DiverseFi modules:

- **Menus/modules** appear only if the user's role grants `read` on that menu path
  (e.g. `/assets`, `/dashboard`, `/polymarket`).
- **CRUD actions** (create/update/delete positions) gated by `write`/`update`/
  `delete` permissions per menu.
- **Experimental Web3 features** (e.g. Polymarket, wallet sync) gated behind
  specific roles so only opted-in users see them.
- New protected API routes that need gating are added to the backend
  `RoutePermissions` map (see `conventions.md` §2.3 and `architecture.md` §2.7).

---

## 7. External Integrations

| Source | Asset types | API | Notes |
|---|---|---|---|
| **Yahoo Finance** | `stock_id`, `stock_us` | `query1.finance.yahoo.com` (unofficial) | Free, no key for basic |
| **Alpha Vantage** | `stock_id`, `stock_us` | REST, API key | Free tier: 25 req/day |
| **CoinGecko** | `crypto_*` | REST, free tier | Rate-limited; cache aggressively |
| **Public RPC** | `crypto_wallet` | JSON-RPC | On-chain balance reads |
| **Polymarket CLOB** | `polymarket` | REST (`clob.polymarket.com`) | Public, no auth |

Because `price_feeds` is shared system-wide, one fetch serves all users holding
that ticker — minimizing external calls and rate-limit pressure.

---

## 8. Data Model (conceptual)

Full schema with SQL in `specs/SPEC-002-data-schema.md`. Conceptual shape:

```
users                — boilerplate; the tenant identity (+ role)
assets               — per-user ledger
  id, user_id (FK), name, ticker, asset_type, quantity (DECIMAL), broker, metadata (JSONB)
price_feeds          — SHARED market cache (no user_id)
  id, ticker/asset_ref, price (DECIMAL), currency, source, raw_payload (JSONB), fetched_at
portfolio_snapshots  — per-user NAV history (future)
  id, user_id (FK), total_nav, currency, snapshot_at, breakdown (JSONB)
```

Key decisions:
- **`assets` and `portfolio_snapshots` carry `user_id` FK** (strict multi-tenancy).
- **`price_feeds` is shared** (no `user_id`); keyed by ticker/instrument identity.
- `DECIMAL(36, 18)` for quantity and price — exact arithmetic.
- `JSONB` for `metadata` / `raw_payload` — absorbs unpredictable Web3 data.

---

## 9. Non-Functional Requirements

| # | Area | Requirement |
|---|---|---|
| NFR1 | **Multi-tenancy isolation** | Per-user data always scoped by authenticated user at the service layer; a user can never read/write another user's assets/snapshots. |
| NFR2 | **Access control** | RBAC enforced on protected routes; UI hides modules/actions the role lacks. |
| NFR3 | **Auditability** | Mutating actions audit-logged with correlation id; sensitive fields redacted. |
| NFR4 | **Data accuracy** | Quantities/prices as `DECIMAL` — no floating-point imprecision. |
| NFR5 | **External API resilience** | Price fetches best-effort; show stale-price warning past TTL; never crash on 3rd-party failure. |
| NFR6 | **Caching** | Shared `price_feeds` cached with per-source TTL; never hit external APIs on every page load. |
| NFR7 | **Security** | Cookie-based JWT; invite-only provisioning; secrets via env. |
| NFR8 | **UI** | Dark-mode-first, responsive, snappy; live NAV via polling/SSE (no full reloads). |
| NFR9 | **Configurability** | API keys, poll intervals, base currency, thresholds via env. |

---

## 10. Out of Scope

- Billing, subscriptions, payment integrations (no Stripe).
- Open/public self-service registration (access is invite-only/admin-provisioned).
- Automated trading / order execution.
- Tax calculation (export only).

---

## 11. Actors & Roles

| Actor | Description |
|---|---|
| **root / admin** | Platform administrators (boilerplate). Provision users, manage roles/menus, grant access to modules. |
| **user (tenant)** | An invited member. Manages **their own** asset ledger and views **their own** portfolio; module access governed by role. |
| **System** | Background shared price-feed fetcher, scheduler, cache manager. |

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Tenant** | A user; owns a private asset ledger and portfolio. |
| **Asset Ledger** | The per-user `assets` table — what the user owns and how much. |
| **Market Feed** | Shared `price_feeds` cache of external prices. |
| **NAV** | Net Asset Value: `quantity × current_price`, per position or summed per user. |
| **Position** | One row in `assets` — a single holding at one broker/wallet for one user. |
| **Asset type** | `stock_id`, `stock_us`, `crypto_cex`, `crypto_wallet`, `polymarket`. |
| **Feed source** | `yahoo_finance`, `alpha_vantage`, `coingecko`, `public_rpc`, `polymarket_clob`. |
| **Stale price** | A cached price whose `fetched_at` exceeds the configured TTL. |
| **CLOB** | Central Limit Order Book — Polymarket's public trading API. |
| **RBAC** | Role-Based Access Control — gates menus/modules/CRUD per role. |
