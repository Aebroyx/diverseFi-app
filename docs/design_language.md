# Design Language

> **The visual & interaction guide for DiverseFi.** Follow this whenever you build
> or change UI so the look stays consistent across the codebase. Foundation:
> **dark-mode-first (light mode supported)**, **shadcn/ui** components **customized
> via Tailwind**, with the **existing brand purple as the accent**.
>
> Pairs with: `system_spec.md` (what) · `architecture.md` (as-is) · `specs/` (work).

**Last updated:** 2026-06-22

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

Set in `globals.css`. **Override `--primary` to the brand purple in both themes;**
keep the rest as Slate. (Values below are the shadcn Slate defaults with our
primary override — apply during SPEC-001.)

```css
:root {                              /* light */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;            --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;         --popover-foreground: 222.2 84% 4.9%;
  --primary: 252 92% 71%;       --primary-foreground: 0 0% 100%;   /* brand */
  --secondary: 210 40% 96.1%;   --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;       --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;      --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%; --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;  --input: 214.3 31.8% 91.4%;
  --ring: 252 92% 71%;                                            /* brand ring */
  --radius: 0.5rem;
}

.dark {                              /* dark — default */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;       --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;    --popover-foreground: 210 40% 98%;
  --primary: 252 92% 71%;       --primary-foreground: 0 0% 100%;   /* brand */
  --secondary: 217.2 32.6% 17.5%; --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;   --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%; --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;  --input: 217.2 32.6% 17.5%;
  --ring: 252 92% 71%;                                            /* brand ring */
}
```

> Optional: the legacy template's Discord-like dark surfaces (`#2b2d31` bg,
> `#313338` card, `#1e1f22` input) can be mapped onto `--background/--card/--input`
> in `.dark` if we prefer that warmer tone over Slate's blue-gray — decide in
> SPEC-001 and keep it consistent.

### 2.3 Contrast note for the accent

Brand purple `#8A73F9` is a medium-light tone:
- **White on primary ≈ 3.6:1** → OK for **large/semibold** UI text and icons.
- For dense/small text on a primary fill, prefer the deeper **`#5F4AD3`** (≈6:1 with
  white) for the hover/active or high-emphasis variant.

Always keep `--ring` = brand purple so focus states reinforce the brand.

## 3. Tailwind Usage Rules

- **Use semantic utilities:** `bg-background text-foreground`, `bg-card`,
  `bg-primary text-primary-foreground`, `bg-muted text-muted-foreground`,
  `border-border`, `ring-ring`, `bg-destructive`, etc.
- **Dark variants only when a token can't express it:** prefer tokens that already
  flip per theme. Use `dark:` only for genuine per-mode tweaks.
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

- **Buttons:** `default` = brand primary CTA; `secondary`/`outline` = neutral;
  `destructive` = delete/danger; `ghost` = toolbar/icon actions. One primary CTA
  per view. Keep the legacy `loading`/`fullWidth` props via wrappers.
- **Inputs/Forms:** shadcn `Input`/`Textarea`/`Label`; error text in `text-destructive`,
  helper text in `text-muted-foreground`; required marker consistent.
- **Toggle → `Switch`**; checked uses `bg-primary`.
- **Select:** shadcn `Select` behind our existing props (adapter); themed to match inputs.
- **Badges:** map status variants (success/warning/danger/info/neutral) to tokens
  (`bg-primary/15 text-primary` for brand/info, `bg-destructive/15 text-destructive`,
  muted for neutral). Keep the existing variant names.
- **Tables:** `bg-card`, header `text-muted-foreground`, row hover `hover:bg-muted/50`,
  separators `border-border`. Use shadcn `Table` primitives for styling.
- **Overlays (Dialog/AlertDialog/Popover/DropdownMenu):** `bg-popover` + border +
  subtle shadow + scrim; destructive confirms use `AlertDialog` with a destructive CTA.
- **Toasts:** keep `react-hot-toast`; theme to tokens (dark surface, accent/destructive
  accents) so they match.
- **Icons:** `lucide-react` going forward (Heroicons phased out incrementally); size
  with `h-4 w-4`/`h-5 w-5`, color `currentColor`.

## 8. Theming Mechanics

- **Strategy:** `class` on `<html>` via `next-themes`, `defaultTheme="dark"`,
  `attribute="class"`, `disableTransitionOnChange`. No flash of incorrect theme.
- **Toggle:** keep a working light/dark toggle (`ThemeToggle`) wired to `next-themes`.
- Persisted to `localStorage`; system preference may seed first visit but default is dark.

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
