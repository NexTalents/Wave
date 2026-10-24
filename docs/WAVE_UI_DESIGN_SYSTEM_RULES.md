---
description: "WAVE brand and UI design system. Mandatory implementation rules for AI coding agents."
globs:
  - "**/*.{tsx,ts,jsx,js,css,scss,mdx,html}"
alwaysApply: true
---

# WAVE — Brand & UI Design System Rules

> Version: 1.0 | 2026-10-24 | Theme: Modern Eco-Tech SaaS | Primary language: Indonesian where the product requires it.

## 0. Design mission & source of truth

Create an accessible, calm, modern environmental-tech product UI, suitable for public landing pages and a data-dense Waste Price Index (WPI) dashboard. The supplied reference logo has a sage-green field, deep-forest outlines, and a tiny muted-coral detail. Approximate sampled colors: **sage `#86AD7E`**, **ink `#102815`**, and **coral `#BF5B5A`**. Secondary application colors below are deliberate *design extensions*, not colors claimed to be sampled exactly from the logo.

**Important:** The visible lettering in the supplied reference image appears to read “UNGE,” not “WAVE.” Use the illustration only as a *color/style reference*. Do not assume the lettering is the official WAVE wordmark, redraw it, or substitute it in product branding without explicit approval. Use the existing verified WAVE logo asset if available; otherwise use plain text `WAVE`.

Priority order when implementing:
1. Existing repo architecture, components, and design tokens (inspect first).
2. Accessibility and correctness.
3. This system's *semantic tokens* and component rules.
4. Visual polish, only after functional correctness.

Never restyle working unrelated screens in passing. Do not add a new component library, animation package, or font dependency unless existing tools cannot meet the requirement. If shadcn/ui is present, use it. If Tailwind is present, follow the repo's current Tailwind version/configuration; do not assume a particular version.

## 1. Brand foundations

| Role | Hex | Use |
|---|---|---|
| `brand.ink` | `#102815` | Strong brand ink, deep decorative elements |
| `brand.sage` | `#86AD7E` | Distinctive logo hue, soft branded areas |
| `brand.coral` | `#BF5B5A` | Small illustration/accent details only; NOT destructive action color |
| `brand.action` | `#245A32` | Accessible primary buttons, links |
| `brand.actionHover` | `#173F24` | Primary hover |
| `brand.actionPressed` | `#102815` | Pressed controls |
| `brand.pale` | `#EFF5EC` | Subtle green surfaces |
| `canvas` | `#F7FAF5` | App background |
| `surface` | `#FFFFFF` | Cards, panels, dialogs |
| `surfaceAlt` | `#F2F6F0` | Alternate groups, table subheaders |
| `text.primary` | `#172B1C` | Main text |
| `text.secondary` | `#405447` | Secondary body copy |
| `text.muted` | `#647466` | Labels, metadata on white |
| `border` | `#DCE6D8` | Subtle dividers and outlines |
| `border.strong` | `#B9CDB4` | Interactive borders |
| `focus` | `#245A32` | Focus indication |
| `danger` | `#A73943` | Error text, destructive buttons |
| `warning` | `#7A5100` | Warning text on pale yellow |
| `success` | `#245A32` | Success text |
| `info` | `#175B70` | Informational labels |

Avoid putting white text on `brand.sage`, or small white text on `brand.coral`; these do not have sufficient contrast for common text sizes. White text on `brand.action` is approximately 8.1:1. Dark `#102815` on sage is approximately 6:1. Keep normal text contrast >= 4.5:1 and important non-text UI contrast >= 3:1. Verify actual composed states and overlays.

### Color usage guidelines

- Neutral/surface ~75%, shades of green ~20%, coral or attention colors ~5% (guideline, not mechanical quota).
- Coral is for restrained visual character, not every CTA, warning, error, or data series.
- Do NOT communicate success/error or trends by color alone. Add labels, icons, and trend arrows with accessible text.
- Avoid giant green content panels; use green primarily for hierarchy and interaction.

## 2. Semantic theme tokens (canonical CSS)

Use CSS custom properties as the source of truth, ideally in the project's existing global stylesheet. Keep one token definition; do not scatter hex values across components.

```css
:root {
  color-scheme: light;
  --brand-ink: #102815;
  --brand-sage: #86ad7e;
  --brand-coral: #bf5b5a;

  --background: #f7faf5;
  --foreground: #172b1c;
  --card: #ffffff;
  --card-foreground: #172b1c;
  --popover: #ffffff;
  --popover-foreground: #172b1c;

  --primary: #245a32;
  --primary-foreground: #ffffff;
  --primary-hover: #173f24;
  --primary-active: #102815;
  --secondary: #eff5ec;
  --secondary-foreground: #173f24;
  --accent: #e3eee0;
  --accent-foreground: #173f24;
  --muted: #f2f6f0;
  --muted-foreground: #647466;
  --destructive: #a73943;
  --destructive-foreground: #ffffff;

  --border: #dce6d8;
  --input: #b9cdb4;
  --ring: #245a32;

  --success: #245a32;
  --success-background: #e7f3e6;
  --warning: #7a5100;
  --warning-background: #fff4d4;
  --danger-background: #fcebee;
  --info: #175b70;
  --info-background: #e7f4f8;

  --surface-alt: #f2f6f0;
  --navbar-background: rgb(255 255 255 / 94%);
  --sidebar-background: #f2f6f0;
  --sidebar-foreground: #172b1c;
  --sidebar-active: #e3eee0;
  --table-hover: #eff5ec;
  --table-selected: #e3eee0;
  --overlay: rgb(16 40 21 / 55%);

  --chart-1: #245a32;
  --chart-2: #3b7e70;
  --chart-3: #8d7239;
  --chart-4: #6474a7;
  --chart-5: #bf5b5a;
  --chart-grid: #dce6d8;

  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;

  --shadow-xs: 0 1px 2px rgb(16 40 21 / 5%);
  --shadow-sm: 0 2px 6px rgb(16 40 21 / 6%), 0 1px 2px rgb(16 40 21 / 3%);
  --shadow-md: 0 8px 22px rgb(16 40 21 / 8%), 0 2px 6px rgb(16 40 21 / 4%);
  --shadow-lg: 0 18px 48px rgb(16 40 21 / 12%), 0 6px 16px rgb(16 40 21 / 5%);
  --shadow-focus: 0 0 0 3px rgb(36 90 50 / 20%);

  --scrollbar-track: #f2f6f0;
  --scrollbar-thumb: #b9cdb4;
  --scrollbar-thumb-hover: #86ad7e;

  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 260ms;
  --ease-ui: cubic-bezier(.2, .8, .2, 1);
}

.dark {
  color-scheme: dark;
  --background: #0c1810;
  --foreground: #eef6ed;
  --card: #142519;
  --card-foreground: #eef6ed;
  --popover: #192d1e;
  --popover-foreground: #eef6ed;

  --primary: #a6d49b;
  --primary-foreground: #102815;
  --primary-hover: #bce3b2;
  --primary-active: #86ad7e;
  --secondary: #203526;
  --secondary-foreground: #e5f2e2;
  --accent: #2b4932;
  --accent-foreground: #eef6ed;
  --muted: #1b2d20;
  --muted-foreground: #b1c3b2;
  --destructive: #f0959c;
  --destructive-foreground: #38151b;

  --border: #38513d;
  --input: #66826a;
  --ring: #a6d49b;

  --success: #a6d49b;
  --success-background: #1a3825;
  --warning: #f3ce7c;
  --warning-background: #3a2d16;
  --danger-background: #44232a;
  --info: #9bd6e4;
  --info-background: #193740;

  --surface-alt: #192d1e;
  --navbar-background: rgb(20 37 25 / 94%);
  --sidebar-background: #102016;
  --sidebar-foreground: #eef6ed;
  --sidebar-active: #294530;
  --table-hover: #203526;
  --table-selected: #294530;
  --overlay: rgb(0 0 0 / 68%);

  --chart-1: #a6d49b;
  --chart-2: #7dcfc0;
  --chart-3: #e6c37d;
  --chart-4: #aab7ee;
  --chart-5: #ea9596;
  --chart-grid: #38513d;

  --shadow-xs: 0 1px 2px rgb(0 0 0 / 18%);
  --shadow-sm: 0 2px 8px rgb(0 0 0 / 22%);
  --shadow-md: 0 8px 22px rgb(0 0 0 / 28%);
  --shadow-lg: 0 18px 48px rgb(0 0 0 / 36%);
  --shadow-focus: 0 0 0 3px rgb(166 212 155 / 25%);

  --scrollbar-track: #142519;
  --scrollbar-thumb: #47614c;
  --scrollbar-thumb-hover: #86ad7e;
}
```

### Integration rule for shadcn/ui

If existing shadcn/ui expects HSL channels, OKLCH, or a Tailwind v4 `@theme inline` mapping, adapt the values in the repo's current token convention rather than copying hex variables into an incompatible setup. Ensure `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring`, `bg-card`, `text-muted-foreground`, and existing shadcn semantic utilities resolve to the intended colors. Extend the *existing* chart/sidebar token namespace if the app relies on it. Do not create competing stylesheets.

## 3. Typography

- Display & UI family: **Plus Jakarta Sans**, with fallback `Inter, ui-sans-serif, system-ui, sans-serif`.
- Technical data: **JetBrains Mono**, with fallback `ui-monospace, SFMono-Regular, monospace`.
- Load only required weights: 400, 500, 600, 700, 800 as needed; prefer self-hosted/subset font assets already present, otherwise framework-supported font loading. Respect font licensing.
- Base body: `16px` / 1.6; dense dashboard/table body: `14px` / 1.5 (avoid below 12px).
- H1 hero: responsive `clamp(2.5rem, 5vw, 4.5rem)`, weight 700–800, line-height 1.08, letter-spacing -0.035em.
- H1 app page: `clamp(1.875rem, 3vw, 2.5rem)`, weight 700, line-height 1.2.
- H2 section: `clamp(1.5rem, 2.5vw, 2rem)`, weight 700, line-height 1.2.
- H3/card title: `1.125rem–1.25rem`, weight 600–700, line-height 1.35.
- Body: 1rem regular, compact body 0.875rem regular.
- Label/control: 0.875rem weight 500–600.
- Caption: 0.75rem–0.8125rem, weight 500; ensure contrast.
- KPI: `clamp(1.75rem, 3vw, 2.75rem)`, weight 700, `font-variant-numeric: tabular-nums`.
- For IDs, code, and machine timestamps: mono. For *ordinary* prices, use Jakarta Sans with tabular numerals unless a column requires mono alignment.
- Use semantic HTML: one meaningful H1 per page, heading levels in order; never pick heading tags solely for size.

## 4. Spacing, shapes, and page grids

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 px; prefer existing Tailwind spacing tokens.
- Button height: 40px default, 36px compact, 44–48px large. Icon-only controls >= 40px target (44px preferred on touch).
- Input/select height: 40–44px; minimum 44px for mobile forms where feasible.
- Radius: button/input 10px; badge 999px; card 16px; dialog 20px; large feature panels 24px.
- Content max width: marketing 1200px, article content 720–800px; dashboard max width 1600px with responsive paddings 16px mobile, 24px tablet, 32px desktop.
- Dashboard desktop: 12-column responsive grid with 16–24px gaps; tablet 2-column cards; mobile 1-column. Avoid horizontal page scrolling; allow horizontal scrolling only inside dense tables.
- Use 1px borders on most cards, reserved shadows for floating/interactive elements.

## 5. Components: required appearances and states

| Component | Default | Hover / focus | Disabled / error / notes |
|---|---|---|---|
| Primary button | `primary` bg, `primary-foreground` text, 10px radius, 40px height | `primary-hover`, subtle `shadow-sm`, visible 2px focus ring plus offset | Disabled lower emphasis, cursor not-allowed, no hover transform; loading spinner + stable width |
| Secondary button | `secondary` bg, dark green text | `accent` bg, ring on focus | No heavy shadows |
| Outline button | Transparent, `border` 1px, foreground text | `secondary` bg | Ensure contrast of border / label |
| Ghost button | Transparent | `secondary` hover | For toolbars, not the only visual signifier of important CTA |
| Destructive button | `destructive` bg, contrasting foreground | Darker/lighter theme-appropriate tone | Reserve for irreversible actions; require confirmation when needed |
| Text link | `primary` foreground in light mode | Underline on hover and focus | Always discernible from plain text even without color (underline in prose) |
| Icon button | 40–44px hit area, tooltip when ambiguous | Colored highlight + focus ring | Accessible `aria-label` required |
| Badge | Pill, soft semantic background, dark text | N/A | Distinguish Draft, Verified, Pending, Failed, Active by text + optional icon |
| Card | `card` bg, `border` 1px, radius 16px, `shadow-xs` or none | Interactive cards: subtle border/shadow change | Only add pointer cursor if card is actually clickable |
| Input / textarea | `card` bg, `input` border, radius 10px | `ring` outline; maintain contrast | Error uses destructive border/message; labels and help text present |
| Select / combobox | Match inputs | Visible open/focus state | Keyboard arrow/Enter/Escape; avoid custom select if native works |
| Checkbox / switch / radio | Green when selected | High-contrast focus state | Do not rely on color alone |
| Tabs | Transparent bar with active green indicator, or segmented `secondary` surface | Focus-visible | Keyboard-operable, proper tab semantics |
| Accordion | Card-like or divider rows | Soft surface hover | Proper heading/button and `aria-expanded` |
| Table | White/card surface, border dividers, compact 14px body | `table-hover` on hover; `table-selected` on selection | Sticky header only if needed; columns sortable accessibly |
| Tooltip | `brand.ink` dark surface + light text in light mode | Appears on pointer and keyboard focus | Never sole source of essential information |
| Popover/dropdown | Popover surface, border, shadow-md, radius 12px | Active row soft green | Escape closes, focus management correct |
| Dialog | Popover/card, radius 20px, `shadow-lg`, overlay token | Focus trapped while open | Restore focus when closed; use proper title/description |
| Toast/alert | Neutral card + semantic border/icon | N/A | `role=status` or alert semantics based on urgency |
| Progress | Pale track, green fill | N/A | Value text + proper progress semantics |
| Skeleton | Muted sage-neutral animated shimmer | N/A | Respect reduced motion |
| Pagination | Outlined/ghost controls, active `secondary` | Focus ring | Disable unavailable arrows |
| Breadcrumb | Muted parent links, strong current text | Underline interactive ancestors | `aria-label="Breadcrumb"` |
| Date picker | Popover card + active day green | Focus ring and keyboard nav | Date formatting locale aware |
| Navbar | `navbar-background`, 1px bottom border, optional `backdrop-filter: blur(12px)` | Active nav via indicator | Mobile menu must be keyboard accessible |
| Sidebar | `sidebar-background`, border-right | Active item `sidebar-active` + green indicator | No icon-only navigation without labels/tooltips |
| Footer | Neutral/dark forest surface per context | Links visibly interactive | Do not put unreadable sage text on pale background |
| Empty state | Minimal icon/illustration, useful explanation, one action | N/A | Never imply data exists when it does not |
| Error state | Short actionable error, optional retry | N/A | Include recovery path and telemetry as repo allows |

### Layer hierarchy

- Page: `background`; standard content: `card`; inset clusters: `muted`; floating components: `popover`.
- Do not stack more than one visible decorative shadow inside a component cluster.
- Focus must never be suppressed with `outline: none` without a genuine visible replacement.

## 6. Shadows, motion and interaction

- Use `--shadow-xs` for regular cards (optional), `--shadow-sm` for elevated action/buttons, `--shadow-md` for dropdowns and interactive cards, `--shadow-lg` for modal/dialog.
- Shadows must use green-tinted dark ink in light mode, not large saturated neon green glows.
- Hover transition: `120–180ms`; modal/accordion enter/exit: up to 260ms using `--ease-ui`.
- Transform on hover for marketing feature cards: max translateY(-2px); avoid lift on tables and form controls.
- Never animate layout-heavy effects continuously; animate opacity/transform only when possible.
- Respect `prefers-reduced-motion: reduce`; remove smooth scrolling and nonessential animation.
- Loading indicators must communicate real state; do not use arbitrary long delays to show animations.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 7. Scrollbar rules

Use subtle scrollbars only where custom scrollbars are useful. Preserve native scroll behavior and visible discoverability. Browser-specific styling is progressive enhancement; on touch devices default system scrollbars are acceptable.

```css
/* Firefox */
.scroll-area, html {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  scrollbar-width: thin;
}
/* Chromium / WebKit */
.scroll-area::-webkit-scrollbar, html::-webkit-scrollbar { width: 10px; height: 10px; }
.scroll-area::-webkit-scrollbar-track, html::-webkit-scrollbar-track { background: var(--scrollbar-track); }
.scroll-area::-webkit-scrollbar-thumb, html::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border: 2px solid var(--scrollbar-track);
  border-radius: 999px;
}
.scroll-area::-webkit-scrollbar-thumb:hover, html::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

Do not globally hide scrollbars; avoid styling every nested scroll area if the browser provides a better native experience.

## 8. WPI dashboard-specific rules

WPI is a **data interface**, not a decorative landing page. Optimize for clear price comparisons and evidence status.

### Information hierarchy

1. Page heading `Waste Price Index (WPI)` + last-updated timestamp + region selector.
2. High-level KPI cards: current index, price change (7d/30d), covered materials, reporting coverage.
3. Time-series price/index chart with selectable range and clear units.
4. Material price table with search, filters, sort, units, and historical comparison.
5. Methodology/data-source panel with freshness and verification status.
6. Loading, partial-data, missing-data, and unavailable-source states.

Do not make up prices, percentage changes, historical data, geographic coverage, update intervals, or methodology. Clearly label example/demo data as illustrative.

### Data formatting

- Currency: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` where appropriate.
- Always show metric units such as `/kg`, `/ton`, `%`, and period next to values.
- Prefer `Intl.DateTimeFormat('id-ID', ...)` for dates; express WIB only when timezone conversion is confirmed.
- Align numeric table cells right; use tabular numbers. Align text columns left.
- Positive price movement is **not inherently beneficial**; don't automatically mark upward movement green or downward red. Use neutral arrows and contextual labels unless explicitly defined by product semantics.
- Chart axes must show units and interval; tooltip must show precise value, date, series, and unit.
- Keep chart color assignment consistent across panels; use patterns/dashes or labeling if needed beyond color.
- Missing data: display `—` with accessible explanation, never fake `0`.
- Show independent *data verified* vs *price up/down* indicators.

## 9. Marketing/landing page rules

- Hero: off-white canvas, bold deep-green headline, concise product value proposition, one primary CTA and at most one secondary CTA.
- Place sage-green large illustrative elements sparingly; mascot art may be used only from approved assets.
- Alternate neutral and pale sage backgrounds between long sections; do not introduce unrelated bright gradients.
- Feature cards: border + small icon, balanced text, ample whitespace.
- Product demonstrations should match the real implementation; avoid fabricated dashboards presented as production results.
- Use one consistent navbar/footer shared by marketing pages where architecture supports it.

## 10. Responsive and accessibility rules

- Design mobile-first; test viewport widths 360, 390, 768, 1024, and 1440 px as relevant.
- No horizontal overflow on ordinary pages. Dense WPI tables may scroll inside a labeled container; keep key columns accessible.
- Keyboard: visible focus, logical Tab order, Enter/Space activation, Escape close, accessible dialogs/menus.
- Forms: associate labels, descriptions and errors with controls; preserve entered values on validation failure.
- Contrast: WCAG AA as minimum (normal text >= 4.5:1, large text >= 3:1, meaningful controls/icons >= 3:1). Verify real rendering in both themes.
- Touch targets: prefer 44x44 CSS px, with appropriate spacing.
- Graphics: meaningful alt text; decorative SVGs/images hidden from assistive tech.
- Tables: `<th scope>` or equivalent headers; sortable header state exposed accessibly.
- Prefer reduced motion and native browser behavior over visually impressive but fragile interactions.

## 11. AI coding agent execution protocol

Every time a UI task is requested:

1. Inspect affected routes, components, global CSS, Tailwind configuration, fonts, installed UI primitives, and existing theme support.
2. Identify the minimum set of files to change. Do not perform unsolicited refactors.
3. Reuse existing components, semantic tokens, and library conventions; shadcn/ui components when already installed.
4. Implement required states, not merely a static screenshot: default, hover, focus, active, disabled, loading, error, empty.
5. Check light/dark themes (if dark mode is enabled in the product), mobile/desktop layout, keyboard access, and contrast.
6. Run the most relevant available checks: typecheck, lint, and affected tests; use browser/screenshot comparison when tools exist.
7. End the delivery with: changed files, key design decisions, checks run with results, and any unverified behavior/risks.

### Forbidden patterns

- Hardcoding new colors repeatedly in JSX/Tailwind (`bg-[#...]`) when semantic tokens exist.
- Mixing several unrelated font families or using the logo's sage background for all cards.
- Using coral as the default destructive color merely because it appears in the mascot.
- Inserting decorative animation into data-heavy WPI tables.
- Treating upward movements as automatically positive or generating fictional data.
- Removing focus outline, relying on hover-only interactions, or hiding scrollbars globally.
- Importing major new UI libraries without a functional need.
- Replacing official WAVE brand assets with the reference logo's ambiguous wordmark.

## 12. Done criteria

A WAVE UI change is complete only when it is **consistent, responsive, accessible, functional, and minimally scoped**. Token consistency is more important than visual novelty. Report any test that could not be run instead of claiming verification.
