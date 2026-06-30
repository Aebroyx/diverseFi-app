# Specs Index

Per-feature specifications for DiverseFi. Each spec is a self-contained unit of
work with goal, requirements, acceptance criteria, plan, status, and changelog —
so anyone (human or agent) can pick it up with full context.

## How to use (SDD working agreement)

1. **Before writing any code**, read the system context in this order:
   `../system_spec.md` → `../conventions.md` → `../design_language.md` →
   `../architecture.md`, then the
   relevant spec file below.
2. Work the **active** spec (status `IN PROGRESS`). Keep changes small and testable (XP).
3. **Update the spec as you go**: flip requirement/phase statuses, log decisions
   and risks, and append a changelog entry.
4. **One feature = one spec file.** Create a new `SPEC-00N-<slug>.md` for new work;
   do not overload an existing spec.

**Status legend:** `DRAFT` · `IN PROGRESS` · `BLOCKED` · `DONE`

## Index

| ID | Spec | Scope | Status |
|---|---|---|---|
| SPEC-001 | [shadcn/ui Migration (Dark Mode + Slate + Brand Primary)](./SPEC-001-shadcn-ui-migration.md) | `diverseFI-web/` | DONE |
| SPEC-002 | [Core Data Schema (Per-User Ledger + Shared Market Feed)](./SPEC-002-data-schema.md) | `diverseFI-api/` | DRAFT |

## Naming convention

`SPEC-<zero-padded number>-<kebab-slug>.md` (e.g. `SPEC-002-user-mfa.md`).
