# SPEC-002 — Core Data Schema (Per-User Asset Ledger + Shared Market Feed)

> Per-feature spec. Read system context first: `../system_spec.md`,
> `../conventions.md`, `../design_language.md`, `../architecture.md`.
> See `README.md` for the spec index.

| | |
|---|---|
| **Status** | DRAFT |
| **Owner** | AI engineer |
| **Created** | 2026-06-22 |
| **Scope** | `diverseFI-api/` — PostgreSQL schema + GORM models |
| **Depends on** | Boilerplate `users` table (tenant identity). SPEC-001 (UI) is independent. |

---

## Goal

Define and implement DiverseFi's foundational PostgreSQL schema:

- **`assets`** — the **per-user** Asset Ledger (strict multi-tenancy).
- **`price_feeds`** — the **shared, system-wide** Market Feed cache (no user coupling).
- **`portfolio_snapshots`** — **per-user** NAV history (future-ready stub).

Supports all three asset classes (Web2 equities, Web3 crypto, Polymarket).

---

## Design Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | `DECIMAL(36, 18)` for quantity and price | Exact arithmetic; no float rounding on financial values |
| D2 | `JSONB` for `metadata` and `raw_payload` | Absorbs unpredictable Web3 / Polymarket contract data without migrations |
| D3 | Single `assets` table with `asset_type` discriminator | Avoids per-type table proliferation; type-specific fields live in `metadata` |
| D4 | **`assets.user_id` + `portfolio_snapshots.user_id` FK → `users`** | **Strict multi-tenancy** — each row belongs to exactly one tenant |
| D5 | **`price_feeds` is SHARED (no `user_id`)**, keyed by a `feed_key` | Market prices are universal; one fetch serves every user holding that instrument → fewer external API calls |
| D6 | `feed_key` on both `assets` and `price_feeds` | Decouples the shared feed from per-user assets; NAV = join on `feed_key`. Format: `"<source>:<symbol>"` (e.g. `coingecko:bitcoin`, `yahoo:BBCA.JK`, `polymarket:<token_id>`) |
| D7 | `price_feeds` append-log; latest row per `feed_key` = current price | Preserves history; current price via `DISTINCT ON (feed_key) ... ORDER BY fetched_at DESC` |
| D8 | Soft-delete (`deleted_at`) on `assets` only | Price feeds never deleted; assets soft-deleted to preserve history |

---

## Tenancy & Isolation (NFR1)

- **Every** read/write of `assets` and `portfolio_snapshots` is scoped by the
  authenticated `user_id` at the **service/repository layer** — never trust a
  client-supplied user id. (See `conventions.md` §3.2 backend isolation rule.)
- `price_feeds` is intentionally **not** user-scoped; it is safe to share because it
  contains only public market data.
- A composite index on `(user_id, asset_type)` keeps per-user list queries fast.

---

## Requirements

| # | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| R1 | `assets` table (per-user) via AutoMigrate | Columns incl. `user_id` FK + `feed_key`; indexed on `(user_id, asset_type)` | TODO |
| R2 | `price_feeds` table (shared) | No `user_id`; `feed_key` + `fetched_at` indexed for latest-price queries | TODO |
| R3 | `portfolio_snapshots` table (per-user) | `user_id` FK; ready for future NAV history | TODO |
| R4 | GORM models in `internal/domain/models/` | `Asset`, `PriceFeed`, `PortfolioSnapshot` with correct tags + FK to `Users` | TODO |
| R5 | AutoMigrate order updated | New tables added to `migration.go` **after** `users` (FK dependency) | TODO |
| R6 | Tenant-scoped repository pattern | Service methods require `userID` and filter by it; verified by a test | TODO |
| R7 | Dev seeder | Inserts representative positions per `asset_type` for a seeded user | TODO |

---

## Proposed PostgreSQL Schema

### `assets` — per-user Asset Ledger (what a user owns)

```sql
CREATE TABLE assets (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenancy (strict multi-tenancy)
    user_id     BIGINT          NOT NULL REFERENCES users(id),

    -- Identity
    name        VARCHAR(255)    NOT NULL,   -- "Bank Central Asia"
    ticker      VARCHAR(100),               -- "BBCA.JK", "BTC", "ETH"
    asset_type  VARCHAR(50)     NOT NULL,   -- discriminator (enum below)
    broker      VARCHAR(100),               -- "Growin", "Mandiri", "Pintu", "Self-custody"

    -- Link to the SHARED market feed
    feed_key    VARCHAR(255)    NOT NULL,   -- "<source>:<symbol>", e.g. "coingecko:bitcoin"

    -- Ledger
    quantity    DECIMAL(36,18)  NOT NULL,   -- exact share / coin / token quantity

    -- Flexible, type-specific fields
    metadata    JSONB           NOT NULL DEFAULT '{}',

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_assets_user_type ON assets (user_id, asset_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_feed_key  ON assets (feed_key);
CREATE INDEX idx_assets_deleted_at ON assets (deleted_at);
```

> `user_id` is `BIGINT` to match the boilerplate `users.id` type — **confirm the
> actual PK type in `architecture.md`/the `Users` model during implementation** and
> align (it may be `uint`/`BIGINT`).

**`asset_type` enum (enforced at app layer):**

| Value | Meaning | Typical `feed_key` |
|---|---|---|
| `stock_id` | Indonesian equity (IDX) | `yahoo:BBCA.JK` / `alphavantage:BBCA.JK` |
| `stock_us` | US equity / index / ETF | `yahoo:SPY` |
| `crypto_cex` | Crypto on a CEX (Pintu) | `coingecko:bitcoin` |
| `crypto_wallet` | Crypto in self-custody wallet | `coingecko:ethereum` |
| `polymarket` | Polymarket ERC-1155 outcome position | `polymarket:<token_id>` |

**`metadata` JSONB shape per type:**

```jsonc
// stock_id / stock_us
{ "exchange": "IDX", "isin": "ID1000109000", "currency": "IDR" }

// crypto_cex
{ "coin_id": "bitcoin", "coingecko_id": "bitcoin" }

// crypto_wallet
{ "coin_id": "ethereum", "coingecko_id": "ethereum", "chain": "ethereum",
  "wallet_address": "0xABC...", "contract_address": null }

// polymarket
{ "market_id": "0x...", "condition_id": "0x...", "question": "Will X happen?",
  "outcome_index": 0, "token_id": "12345678" }
```

---

### `price_feeds` — SHARED Market Feed cache (system-wide)

```sql
CREATE TABLE price_feeds (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Shared instrument identity (NO user_id — shared across all tenants)
    feed_key     VARCHAR(255)    NOT NULL,   -- "<source>:<symbol>"
    asset_type   VARCHAR(50)     NOT NULL,   -- for disambiguation/reporting
    source       VARCHAR(100)    NOT NULL,   -- yahoo_finance | alpha_vantage | coingecko | public_rpc | polymarket_clob

    price        DECIMAL(36,18)  NOT NULL,
    currency     VARCHAR(10)     NOT NULL,   -- "USD", "IDR", ...

    raw_payload  JSONB           NOT NULL DEFAULT '{}',  -- full API response
    fetched_at   TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Primary query: latest shared price for an instrument
CREATE INDEX idx_price_feeds_key_fetched ON price_feeds (feed_key, fetched_at DESC);
CREATE INDEX idx_price_feeds_fetched_at  ON price_feeds (fetched_at DESC);
```

**Latest shared price per instrument:**

```sql
SELECT DISTINCT ON (feed_key)
    feed_key, price, currency, source, fetched_at
FROM price_feeds
ORDER BY feed_key, fetched_at DESC;
```

**NAV for a user (ledger × shared latest price):**

```sql
WITH latest AS (
  SELECT DISTINCT ON (feed_key) feed_key, price, currency
  FROM price_feeds ORDER BY feed_key, fetched_at DESC
)
SELECT a.id, a.name, a.quantity, l.price, l.currency,
       (a.quantity * l.price) AS nav
FROM assets a
JOIN latest l ON l.feed_key = a.feed_key
WHERE a.user_id = $1 AND a.deleted_at IS NULL;
```

---

### `portfolio_snapshots` — per-user NAV history (future)

```sql
CREATE TABLE portfolio_snapshots (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      BIGINT          NOT NULL REFERENCES users(id),
    total_nav    DECIMAL(36,18)  NOT NULL,
    currency     VARCHAR(10)     NOT NULL DEFAULT 'USD',
    breakdown    JSONB           NOT NULL DEFAULT '{}',  -- per-asset NAV at snapshot time
    snapshot_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_snapshots_user_at ON portfolio_snapshots (user_id, snapshot_at DESC);
```

---

## GORM Model Sketches (`internal/domain/models/`)

```go
// asset.go
type AssetType string

const (
    AssetTypeStockID      AssetType = "stock_id"
    AssetTypeStockUS      AssetType = "stock_us"
    AssetTypeCryptoCEX    AssetType = "crypto_cex"
    AssetTypeCryptoWallet AssetType = "crypto_wallet"
    AssetTypePolymarket   AssetType = "polymarket"
)

type Asset struct {
    ID        uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    UserID    uint            `gorm:"not null;index:idx_assets_user_type"` // FK → users.id (confirm type)
    Name      string          `gorm:"not null"`
    Ticker    string
    AssetType AssetType       `gorm:"not null;index:idx_assets_user_type"`
    Broker    string
    FeedKey   string          `gorm:"not null;index"`
    Quantity  decimal.Decimal `gorm:"type:decimal(36,18);not null"`
    Metadata  datatypes.JSON  `gorm:"type:jsonb;not null;default:'{}'"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt  `gorm:"index"`

    User  Users `gorm:"foreignKey:UserID"` // existing boilerplate model
}

// price_feed.go  (SHARED — no UserID)
type FeedSource string

const (
    SourceYahooFinance   FeedSource = "yahoo_finance"
    SourceAlphaVantage   FeedSource = "alpha_vantage"
    SourceCoinGecko      FeedSource = "coingecko"
    SourcePublicRPC      FeedSource = "public_rpc"
    SourcePolymarketCLOB FeedSource = "polymarket_clob"
)

type PriceFeed struct {
    ID         uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    FeedKey    string          `gorm:"not null;index:idx_price_feeds_key_fetched"`
    AssetType  AssetType       `gorm:"not null"`
    Source     FeedSource      `gorm:"not null"`
    Price      decimal.Decimal `gorm:"type:decimal(36,18);not null"`
    Currency   string          `gorm:"not null"`
    RawPayload datatypes.JSON  `gorm:"type:jsonb;not null;default:'{}'"`
    FetchedAt  time.Time       `gorm:"not null;default:now();index:idx_price_feeds_key_fetched,sort:desc"`
}

// portfolio_snapshot.go  (per-user)
type PortfolioSnapshot struct {
    ID         uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    UserID     uint            `gorm:"not null;index"`
    TotalNAV   decimal.Decimal `gorm:"type:decimal(36,18);not null"`
    Currency   string          `gorm:"not null;default:'USD'"`
    Breakdown  datatypes.JSON  `gorm:"type:jsonb;not null;default:'{}'"`
    SnapshotAt time.Time       `gorm:"not null;default:now()"`

    User Users `gorm:"foreignKey:UserID"`
}
```

**New dependencies:**
- `github.com/shopspring/decimal` — exact `decimal.Decimal`
- `gorm.io/datatypes` — `datatypes.JSON` (JSONB)

---

## Migration Order Update

Add to `internal/database/migration.go` **after** `users` (FK dependency) and the
existing boilerplate tables:

```go
// DiverseFi domain models (after users — FK dependency)
db.AutoMigrate(&models.Asset{})
db.AutoMigrate(&models.PriceFeed{})
db.AutoMigrate(&models.PortfolioSnapshot{})
```

---

## RBAC / Menu Wiring (cross-ref SPEC + system_spec §6)

When the asset/portfolio API routes are added, register a menu path (e.g.
`/assets`, `/dashboard`, `/polymarket`) and add protected routes to the backend
`RoutePermissions` map so RBAC gates read/write/update/delete. Experimental
modules (Polymarket, wallet sync) should be gated behind a dedicated role.
*(API routes are a later spec; this spec is schema-only.)*

---

## Execution Checklist

- [ ] Confirm `users.id` PK type (`uint`/`BIGINT`) and align FK columns
- [ ] Add `shopspring/decimal` + `gorm.io/datatypes` to `go.mod`
- [ ] Create `internal/domain/models/asset.go` (with `UserID` FK + `FeedKey`)
- [ ] Create `internal/domain/models/price_feed.go` (shared, no `UserID`)
- [ ] Create `internal/domain/models/portfolio_snapshot.go` (with `UserID` FK)
- [ ] Update `internal/database/migration.go` (after `users`)
- [ ] Add tenant-scoped seeder (positions per type for a seeded user)
- [ ] `go build ./...` clean; verify tables + FKs in dev DB
- [ ] Update R1–R7 statuses and append changelog

---

## Open Questions

- OQ-1: Same instrument at multiple brokers/wallets (e.g. BTC at Pintu + in wallet)?
  **Proposal: allowed** — two `assets` rows, same `feed_key`, `broker` differentiates;
  per-user NAV sums both.
- OQ-2: Base display currency — global `BASE_CURRENCY=USD` env, or **per-user**
  preference? **Proposal: start global env; revisit per-user later.**
- OQ-3: Price-feed TTL per source — env vars (`PRICE_TTL_STOCK`, `PRICE_TTL_CRYPTO`,
  `PRICE_TTL_POLYMARKET`) for now.
- OQ-4: `feed_key` derivation — computed in the service from `asset_type` + ticker/
  `metadata` on asset create/update, then stored. **Proposal: yes, store it** so
  feed joins are a simple equality.

## Changelog

- 2026-06-22: Spec created (single-user assumption).
- 2026-06-22: **Reworked for strict multi-tenancy** — added `user_id` FK to
  `assets` and `portfolio_snapshots`; decoupled `price_feeds` into a shared,
  `feed_key`-based cache (no user coupling); added isolation requirement (R6) and
  RBAC/menu wiring note.
