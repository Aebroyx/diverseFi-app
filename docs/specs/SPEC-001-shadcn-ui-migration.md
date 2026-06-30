# SPEC-001 — shadcn/ui Migration (Dark Mode + Slate + Brand Primary)

> Per-feature spec. Read the system context first: `../system_spec.md`,
> `../conventions.md`, `../design_language.md`, `../architecture.md`. Update statuses + changelog as work
> progresses. See `README.md` for the spec index and which spec is currently active.

| | |
|---|---|
| **Status** | IN PROGRESS |
| **Owner** | AI engineer |
| **Created** | 2026-06-22 |
| **Scope** | `diverseFI-web/` only (no backend/API changes) |
| **Status legend** | `DRAFT` · `IN PROGRESS` · `BLOCKED` · `DONE` |

## Goal

Replace the custom component library with `shadcn/ui` while preserving the
template's brand identity, defaulting to dark mode.

## Confirmed decisions (from kickoff Q&A)

- **D1 — Approach:** Plan first (this document), no code changes until approved.
- **D2 — Select:** Build a **shadcn Select adapter** that keeps the current
  `Select.tsx` props API so call sites don't change.
- **D3 — Theme toggle:** **Keep** the light/dark toggle, but **default to dark**.
- **D4 — CLI is mandatory:** All shadcn components MUST be pulled via the CLI
  (`npx shadcn@latest add <component>`). **Do NOT hand-write component source.**
  Hand-editing is only allowed *after* a component is generated, to adapt props
  or styling.

## Requirements

| # | Requirement | Acceptance criteria | Status |
|---|---|---|---|
| R1 | Initialize shadcn/ui via CLI | `components.json` exists; `cn()` at `@/lib/utils`; deps installed (`tailwind-merge`, `clsx`, `class-variance-authority`, `tailwindcss-animate`, `lucide-react`, Radix); `npm run build` passes | DONE |
| R2 | Default Dark Mode | App renders dark by default with no flash of light; toggle still works and persists | DONE |
| R3 | Slate base theme | shadcn Slate HSL tokens applied in `globals.css` for `:root` + `.dark` | DONE |
| R4 | Preserve brand primary | `--primary` overridden to `#8A73F9` (`252 92% 71%`) in both themes; `--primary-foreground` readable | DONE |
| R5 | Migrate primitives (CLI-pulled) | Buttons, Input/Textarea/Toggle, Select (adapter), Badges, Card/FormCard, modals, Table use shadcn; pages render & function unchanged | IN PROGRESS |
| R6 | RBAC-gated UI intact | Auth flows + admin dashboards work after migration; menus/actions still show/hide per role (RBAC gating unchanged) | TODO |

---

## Execution Plan (phased)

> Each phase ends in a buildable, reviewable state. Run `npm run build` (and a
> quick manual smoke test) at the end of every phase. Update statuses here as we go.

### Phase 0 — Pre-flight & safety net
- Confirm clean-ish git state for `diverseFI-web/`; create a checkpoint commit/branch
  reference so the migration is revertible.
- Confirm Node/npm versions and that `diverseFI-web` builds today (`npm run build`).
- Note React 19 / Next 16 peer-dep caveat: shadcn CLI may need
  `--legacy-peer-deps` (or equivalent) when adding Radix packages.

### Phase 1 — Initialize shadcn (R1) — **CLI**
- Run `npx shadcn@latest init` in `diverseFI-web/`.
  - Base color: **Slate**. Style: default. CSS variables: **yes**.
  - Confirm it writes `components.json`, updates `globals.css` + `tailwind.config.ts`,
    creates/extends `@/lib/utils` with `cn()`.
- **Risk:** init may overwrite our `globals.css` tokens and `tailwind.config.ts`
  color mappings. Mitigation: snapshot both files first, then reconcile in Phase 2.
- Install `lucide-react` (CLI handles most deps; verify `tailwindcss-animate`,
  `clsx`, `tailwind-merge`, `class-variance-authority` present).
- **Existing `@/lib/utils.ts`** already holds password helpers — merge `cn()` in,
  do not clobber those exports.

### Phase 2 — Theme tokens: Slate + brand primary (R3, R4) — manual edit of generated CSS
- In `globals.css`, define shadcn HSL tokens for `:root` (light) and `.dark`:
  - Use Slate values for background/foreground/card/popover/muted/border/input/ring.
  - **Override `--primary: 252 92% 71%`** (`#8A73F9`) in both themes; set
    `--primary-foreground` to a light value for contrast on the purple.
  - Map dark surfaces toward the existing Discord-like palette where it helps
    (`--card`, `--input`, `--border`) without breaking Slate cohesion.
- Keep the legacy `--primary-light/-dark`, `--secondary*`, `--card-bg`, `--input-bg`,
  `--hover-bg`, `--border` variables **temporarily** so un-migrated components keep
  working; remove them only after their consumers are migrated.
- Reconcile `tailwind.config.ts`: keep existing semantic mappings working while
  adding shadcn's `border/input/ring/background/foreground/primary/...` extensions
  and `tailwindcss-animate` plugin.

### Phase 3 — Default Dark Mode + toggle (R2, D3)
- Add `next-themes`; wrap app with `ThemeProvider` (`attribute="class"`,
  `defaultTheme="dark"`, `enableSystem` per preference, `disableTransitionOnChange`).
- Reconcile with the existing custom `ThemeProvider`/pre-paint script in
  `layout.tsx`: replace custom provider with `next-themes` but **preserve no-flash**
  behavior and the toggle.
- Re-wire `ThemeToggle.tsx` to `next-themes` `useTheme()` (keep button UX; optionally
  swap inline SVG for `lucide-react` Sun/Moon). Toggle must persist and default dark.

### Phase 4 — Pull base primitives (R5) — **CLI**
Run, reviewing each generated file:
```
npx shadcn@latest add button input label textarea switch badge card \
  dialog alert-dialog popover dropdown-menu select table command
```
- These land in `src/components/ui/` (shadcn convention). Avoid filename clashes
  with existing custom primitives (`Input.tsx`, `Select.tsx`, `Table.tsx`, etc.);
  shadcn uses lowercase (`input.tsx`, `select.tsx`) — verify case-insensitive FS
  (macOS) doesn't collide. If collision risk, generate then rename custom files.

### Phase 5 — Migrate primitives behind existing APIs (R5)
Order: lowest-risk leaf components first. Keep current prop signatures so call
sites don't change (adapter pattern).
1. **Buttons** — re-implement `PrimaryButton`/`SecondaryButton` on shadcn `Button`
   (preserve `loading`, `fullWidth`, `variant`).
2. **Badges** — `PrimaryBadge`/`SecondaryBadge` on shadcn `Badge` + variant map.
3. **Input/Textarea/Toggle** — wrap shadcn `Input`/`Textarea` + `Label` (+ error/
   helperText); `Toggle` → shadcn `Switch`.
4. **FormCard** family — on shadcn `Card*` (preserve `FormSection/Row/Actions`).
5. **Select adapter (D2)** — wrap shadcn `Select` keeping `Select.tsx`'s props
   (`options`, `value`, `onChange(value)`, `error`, `size`, etc.). Verify in forms
   and `AdvancedFilterModal`.
6. **Table** — restyle simple `Table.tsx` with shadcn `Table` primitives.

### Phase 6 — Migrate modals/overlays (R5) — Headless UI → Radix
- `DeleteModal` → `AlertDialog`; `ProfileModal`/`SettingsModal`/import wizards →
  `Dialog`; `FilterModal` → `Popover`; TopNav/Sidebar menus → `DropdownMenu`;
  `CommandPalette` → shadcn `Command` (already cmdk-based).
- **CHECKPOINT — stop & ask** before touching complex logic: `DataTable/*`,
  `MasterTable`, `MenuPermissionsEditor`, `RoleMenuPermissionsEditor`, import
  wizards, and the axios refresh flow. Migrate styling without altering behavior;
  if a change risks breaking logic, pause and confirm.

### Phase 7 — Cleanup & verify
- Remove now-unused legacy CSS vars / Headless UI usages once all consumers migrated.
- `npm run lint` + `npm run build` clean; manual smoke test of login, dashboard,
  users/roles/menus CRUD, modals, theme toggle (defaults dark), command palette.
- Update R1–R5 statuses to DONE and write a changelog entry.

---

## Constraints / decisions

- Do not invent API endpoints — use `../architecture.md` §2.4.
- **shadcn components must be CLI-generated** (`npx shadcn@latest add ...`), not
  hand-written (D4).
- Keep components small and reusable; prefer adapters over rewriting feature logic.
- **Stop and ask** before changing complex logic that could break (Phase 6 checkpoint).

## Brand reference (authoritative)

`--primary #8A73F9` = `252 92% 71%` · `--primary-dark #5F4AD3` ·
`--primary-light #BFA7FF` · accent `--secondary #E2F973`.

## Open questions / risks log

- R-1: shadcn `init` may overwrite `globals.css`/`tailwind.config.ts` — snapshot first.
- R-2: React 19 / Next 16 peer deps may require `--legacy-peer-deps`.
- R-3: macOS case-insensitive FS — watch for `Input.tsx` vs `input.tsx` collisions.
- R-4: `proxy.ts` server-side gating may be unwired (tracked in architecture.md; out
  of scope for this spec but verify pages still load).

## Changelog

- 2026-06-22: Spec created; backend + frontend architecture assessed (architecture.md).
- 2026-06-22: Detailed phased migration plan added; decisions D1–D4 recorded
  (plan-first, Select adapter, keep toggle + dark default, CLI-only components).
- 2026-06-22: Docs restructured — spec moved from `docs/active_spec.md` to
  `docs/specs/SPEC-001-shadcn-ui-migration.md`; system spec/design docs added.
- 2026-06-22: Added R6 — verify RBAC-gated UI (auth flows, admin dashboards,
  per-role menu/action visibility) remains intact after migration.
- 2026-06-30: Phase 0–5 executed. shadcn v4 CLI init + components in
  `src/components/ui/shadcn/` (avoids macOS case collisions). Upgraded to
  Tailwind v4 (`@tailwindcss/postcss`, `tw-animate-css`, `shadcn/tailwind.css`).
  Theme: Slate HSL + brand primary `#8A73F9`; default dark via `next-themes`.
  Adapters migrated: buttons, Input/Textarea/Toggle, Select, badges, FormCard,
  Table, DeleteModal, ProfileModal, SettingsModal, FilterModal, TopNav dropdown.
  Remaining Headless UI: Sidebar mobile sheet, CommandPalette shell, import
  modals, AdvancedFilterModal (Phase 6 checkpoint).
