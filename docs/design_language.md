# Design Language

> **The visual & interaction guide for DiverseFi.** Follow this whenever you build
> or change UI so the look stays consistent across the codebase. Foundation:
> **dark-mode-first (light mode supported)**, **shadcn/ui** components **customized
> via Tailwind**, with the **existing brand purple as the accent**.
>
> Pairs with: `system_spec.md` (what) · `architecture.md` (as-is) · `specs/` (work).

**Last updated:** 2026-06-30

---

## 1. Principles

1. **Dark-first, light-supported.** Design and verify in dark mode first; ensure
   light mode is correct too. Default theme = **dark**.
2. **Token-driven, never hardcoded.** Style with semantic Tailwind tokens
   (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, …). **Never**
   use raw hex or arbitrary color values in components.
3. **shadcn/ui as the base, customized to us.** Components are pulled via the CLI
   (`npx shadcn@latest add <component>`), then themed through CSS variables +
   Tailwind — not forked or hand-written.
4. **Brand purple = accent, used with intent.** Primary is for the main action,
   active/selected state, links, and focus rings — not large fills. Most surfaces
   stay neutral Slate; the purple makes the important thing obvious.
5. **Accessible by default.** Meet WCAG AA contrast; always show a visible
   focus-visible ring; never rely on color alone to convey meaning.

## 2. Color System

Base palette = shadcn **Slate** (neutral grays). Semantic tokens are HSL CSS
variables in `globals.css`, consumed via Tailwind. Components reference the
**semantic** name, so re-theming is a token change, not a code change.

### 2.1 Brand tokens (authoritative — preserve)

| Token | Hex | HSL | Use |
|---|---|---|---|
| **Primary / accent** | `#8A73F9` | `252 92% 71%` | Primary buttons, active/selected, links, focus ring |
| Primary hover/active | `#5F4AD3` | `249 58% 56%` | Hover/pressed of primary; high-contrast primary text |
| Primary subtle | `#BFA7FF` | `255 100% 83%` | Subtle accents, light-mode tints |
| Secondary accent (lime) | `#E2F973` | `73 91% 71%` | Sparing highlight; **not** a CTA color |

### 2.2 Semantic tokens (Slate base + brand override)

Set in `diverseFI-web/src/app/globals.css`. **Override `--primary` to the brand purple
in both themes.** Light mode uses standard shadcn Slate values. Dark mode uses
**neutral Discord-like surfaces** (low-saturation grays) — not the default shadcn
Slate blue-gray — so footers, hovers, and selection highlights stay cohesive.

Values below match the live `globals.css` (HSL wrapped in `hsl()` in code):

```css
:root {                              /* light */
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);           --card-foreground: hsl(222.2 84% 4.9%);
  --popover: hsl(0 0% 100%);        --popover-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(252 92% 71%);      --primary-foreground: hsl(0 0% 100%);   /* brand */
  --secondary: hsl(210 40% 96.1%);  --secondary-foreground: hsl(222.2 47.4% 11.2%);
  --muted: hsl(210 40% 96.1%);     --muted-foreground: hsl(215.4 16.3% 46.9%);
  --accent: hsl(210 40% 96.1%);    --accent-foreground: hsl(222.2 47.4% 11.2%);
  --destructive: hsl(0 84.2% 60.2%); --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(214.3 31.8% 91.4%); --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(252 92% 71%);                                           /* brand ring */
  --radius: 0.5rem;
}

.dark {                              /* dark — default */
  --background: hsl(223 7% 18%);    /* ~#2b2d31 app shell */
  --foreground: hsl(0 0% 93%);
  --card: hsl(220 6% 20%);          --card-foreground: hsl(0 0% 93%);   /* ~#313338 */
  --popover: hsl(220 6% 20%);       --popover-foreground: hsl(0 0% 93%);
  --primary: hsl(252 92% 71%);     --primary-foreground: hsl(0 0% 100%); /* brand */
  /* Neutral slate — same hue family as card/background; avoid blue cast on muted/accent */
  --secondary: hsl(220 5% 23%);    --secondary-foreground: hsl(0 0% 93%);
  --muted: hsl(220 5% 23%);        --muted-foreground: hsl(220 5% 65%);
  --accent: hsl(220 5% 26%);      --accent-foreground: hsl(0 0% 93%);
  --destructive: hsl(0 62.8% 30.6%); --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(220 5% 26%);       --input: hsl(225 6% 13%);             /* ~#1e1f22 */
  --ring: hsl(252 92% 71%);                                           /* brand ring */
}
```

**Legacy aliases** (kept until all consumers migrate off raw `gray-*` / template vars):
`--primary-light`, `--primary-dark`, `--secondary-light`, `--secondary-dark`,
`--card-bg`, `--input-bg`, `--hover-bg`. Prefer semantic tokens for new work.

> **Decision (SPEC-001):** Dark surfaces follow the Discord-like neutral palette above.
> Do **not** revert to shadcn's default dark `--muted`/`--accent` (`217.2 32.6% 17.5%`) —
> that hue reads as navy blue against our neutral cards.

### 2.3 Contrast note for the accent

Brand purple `#8A73F9` is a medium-light tone:
- **White on primary ≈ 3.6:1** → OK for **large/semibold** UI text and icons.
- For dense/small text on a primary fill, prefer the deeper **`#5F4AD3`** (≈6:1 with
  white) for the hover/active or high-emphasis variant.

Always keep `--ring` = brand purple so focus states reinforce the brand.

## 3. Tailwind Usage Rules

- **Tailwind v4 (CSS-first):** Theme config lives in `globals.css` (`@import "tailwindcss"`,
  `@theme inline`). There is no `tailwind.config.ts`. Do not reintroduce v3-style
  `darkMode: 'class'` — it has no effect in v4.
- **Class-based dark mode (required):** After the Tailwind import, keep:
  `@custom-variant dark (&:where(.dark, .dark *));` so `dark:` utilities follow
  the `next-themes` `.dark` class on `<html>`, **not** OS `prefers-color-scheme`.
  Without this line, light mode breaks (dark text/hover styles leak in).
- **Use semantic utilities:** `bg-background text-foreground`, `bg-card`,
  `bg-primary text-primary-foreground`, `bg-muted text-muted-foreground`,
  `border-border`, `ring-ring`, `bg-destructive`, etc.
- **Dark variants only when a token can't express it:** prefer tokens that already
  flip per theme. Use `dark:` only for genuine per-mode tweaks; some legacy pages
  (e.g. `DataTable`, `Sidebar`) still use `gray-*` + `dark:` — migrate to tokens
  when touching those files.
- **Merge classes with `cn()`** (`@/lib/utils`) so overrides compose cleanly.
- **No raw hex / arbitrary values** (`bg-[#8A73F9]`, `text-[13px]`) in components —
  add a token or use the scale.
- **Radius** via `rounded-md`/`rounded-lg` (driven by `--radius`); keep corners consistent.

## 4. Surfaces, Elevation & Spacing

- **Surface hierarchy (dark):** `background` (app) → `card`/`popover` (raised) →
  borders (`border`) to separate, not heavy shadows.
- **Elevation:** subtle shadows only on true overlays (dialogs, dropdowns, popovers).
  Flat cards on flat backgrounds; rely on `border` + slight bg shift.
- **Spacing:** Tailwind 4-pt scale. Common rhythm: inputs/buttons `h-9`–`h-10`,
  card padding `p-6`, section gaps `gap-4`/`gap-6`, page padding `p-4 md:p-6`.

## 5. Typography

- Use the app font stack (Geist via `next/font`); body text `text-sm`/`text-base`,
  headings `text-lg`–`text-2xl font-semibold`.
- Body = `text-foreground`; secondary/help = `text-muted-foreground`.
- Don't color body text with the accent; reserve purple for links/interactive text.

## 6. Interaction States (required on every interactive element)

| State | Treatment |
|---|---|
| Hover | Slight bg/opacity shift (`hover:bg-accent`, or `hover:bg-primary/90` for primary) |
| Focus | **Always** visible `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background` |
| Active/pressed | Deeper shade (primary → `#5F4AD3`) |
| Selected/active nav | `bg-primary/10 text-primary` (or `text-foreground` + left accent) |
| Disabled | `opacity-50 cursor-not-allowed`, no hover |
| Loading | Spinner + disabled; keep width stable (preserve existing `loading` button prop) |

## 7. Component Conventions (shadcn, customized)

- **Component location:** CLI output goes to `@/components/ui/shadcn/` (see
  `components.json` `ui` alias). App-facing adapters/wrappers stay in
  `@/components/ui/` (PascalCase, e.g. `Input.tsx`, `FormCard.tsx`).
- **Buttons:** `default` = brand primary CTA; `secondary`/`outline` = neutral;
  `destructive` = delete/danger; `ghost` = toolbar/icon actions. One primary CTA
  per view. Keep the legacy `loading`/`fullWidth` props via wrappers.
- **Inputs/Forms:** shadcn `Input`/`Textarea`/`Label`; error text in `text-destructive`,
  helper text in `text-muted-foreground`; required marker consistent.
- **FormCard:** page forms use `FormCard` + `FormSection`/`FormRow`; footer actions
  via `FormActions` — **right-aligned** (`Cancel` left of primary within the group).
- **Toggle → `Switch`**; checked uses `bg-primary`.
- **Select:** **`react-select`** behind our existing `Select.tsx` props adapter (not
  shadcn `Select` — rejected for UX: misaligned menu, styling drift). Style via
  semantic CSS variables to match shadcn `Input` (`h-10`, `rounded-lg`, `border-input`,
  focus ring); menu renders in a portal below the control (`menuPortalTarget`).
- **Badges:** map status variants (success/warning/danger/info/neutral) to tokens
  (`bg-primary/15 text-primary` for brand/info, `bg-destructive/15 text-destructive`,
  muted for neutral). Keep the existing variant names.
- **Tables:** `bg-card`, header `text-muted-foreground`, row hover `hover:bg-muted/50`,
  separators `border-border`. Use shadcn `Table` primitives for styling. `DataTable`
  still uses legacy `gray-*` classes — migrate to semantic tokens when editing it.
- **Overlays (Dialog/AlertDialog/Popover/DropdownMenu/Sheet/Command):** `bg-popover`
  + border + subtle shadow + scrim; card/dialog footers use `bg-muted/50` (neutral
  in dark mode after token fix). Destructive confirms use `AlertDialog`.
- **Toasts:** keep `react-hot-toast`; theme to tokens (dark surface, accent/destructive
  accents) so they match.
- **Icons:** `lucide-react` going forward (Heroicons phased out incrementally); size
  with `h-4 w-4`/`h-5 w-5`, color `currentColor`.

## 8. Theming Mechanics

- **Strategy:** `class` on `<html>` via `next-themes`, `defaultTheme="dark"`,
  `attribute="class"`, `storageKey="theme"`, `enableSystem`, `disableTransitionOnChange`.
- **No flash:** inline script in `layout.tsx` reads `localStorage` (including
  `system` → `prefers-color-scheme`) and sets/removes `.dark` before first paint;
  `suppressHydrationWarning` on `<html>`.
- **Tailwind v4 binding:** `@custom-variant dark (&:where(.dark, .dark *));` in
  `globals.css` — **required**; v4 defaults `dark:` to OS preference otherwise.
- **Toggle:** Settings modal (and optional `ThemeToggle`) wired to `next-themes`.
  Persisted to `localStorage`; default is dark.

## 9. Do / Don't

**Do**
- Build/verify in dark mode, then check light.
- Use semantic tokens + `cn()`; pull components via the shadcn CLI.
- Reserve the purple for the one important action / active state.
- Provide visible focus rings and AA contrast.

**Don't**
- Hardcode hex/arbitrary Tailwind values in components.
- Fork shadcn source by hand instead of customizing via tokens/Tailwind.
- Flood a screen with primary fills (accent loses meaning).
- Ship interactive elements without hover/focus/disabled states.
