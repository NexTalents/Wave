# WAVE interface design contract

This is the canonical UI contract for the public WAVE surfaces. It extends the existing landing-page identity and the WPI public market overview; it is not a replacement visual system.

## Product direction

WAVE makes waste prices legible enough for people who collect, aggregate, and buy recyclable material to make fairer decisions. The interface should feel credible, calm, and practical: clear evidence first, brand expression second.

The primary public task is comparing a material's reference value across grade, region, price type, and time period. Public WPI data is prototype data until a production pipeline exists; prototype values must never look like guaranteed market prices.

## Design principles

- **Evidence before decoration.** Labels, dates, units, source, observation count, and prototype status travel with the number they qualify.
- **Separate unlike values.** The validated transaction index and reference deposit price are distinct series and controls.
- **Scan, then inspect.** The overview supports quick comparison; `/wpi/[material]` carries the deeper story.
- **Responsive by priority.** Desktop tables can be dense; mobile uses prioritized cards rather than a forced miniature table.
- **Use the product's voice.** WAVE purple, warm gold, generous whitespace, and editorial headings are the established identity.

## Tokens

These values are sourced from `modules/landing-page/styles.css` and `app/globals.css`.

| Role | Token/value |
| --- | --- |
| Brand 50 | `#f4e5f4` |
| Brand 500 | `#833995` |
| Brand 600 | `#590f6b` |
| Brand 800 | `#331749` |
| Brand 950 | `#130526` |
| Warm gold | `#e7c78e` |
| Chart reference | `#b48738` |
| Disclosure surface | `#fff8e9` |
| Ink | `#343742` |
| Muted | `#8a8a8a` |
| Success | `#14ae53` |
| Warning | `#e38619` |
| Body type | `adelle-sans`, then system sans fallbacks |
| Heading type | `cora`, then Avenir/Segoe/system fallbacks |
| Card radius | `1rem` |
| Panel radius | `2rem` |
| Hero radius | `52px` |
| Desktop breakpoint | `1200px` |

Use semantic roles instead of introducing one-off colors. Gold is reserved for disclosure, reference-price distinction, and supporting emphasis; it is not a generic success color.

## Layout and components

- Use the shared `PageContainer`, `SiteHeader`, and `SiteFooter` for public pages.
- Keep the WPI sequence: explanatory hero → prototype disclosure → status summary → market snapshot → filters → price table → historical movement → material explorer → methodology → disclaimer.
- Keep filter state in the query string so a view can be shared and revisited.
- Tables must expose material, grade, region, price type, value, change, volume, observations, update date, and source.
- Every market card links to a material detail route and shows both index and reference values.
- Empty and unavailable states must explain why data is absent; never substitute a believable default value.
- Accordion answers should remain keyboard reachable with visible focus, and chart summaries must be available to assistive technology as text.
- Auth uses a branded split composition: a WAVE context panel beside the task form on wide screens, collapsing into a compact context band above the form on narrow screens. It shares the landing page's purple, gold, pill action, and rounded image-like panel language.
- Auth social actions use real brand marks where required, while ordinary controls use the existing Lucide icon family. Password visibility, loading, error, and disabled states live in the shared auth primitives.
- WPI time series use a single maintained chart library with labeled axes, tooltip, legend, range summary, and a text summary for assistive technology. Missing series values stay missing; they are not converted to zero.

## Responsive behavior

- At the desktop breakpoint, use the full navigation and the dense comparison table.
- Below the desktop breakpoint, collapse navigation and transform table rows into stacked cards with the value, material, grade/region, and provenance first.
- Keep primary controls full-width or two-column on narrow screens; do not hide material, price type, period, or reset actions behind a horizontal scroll.
- Preserve readable line lengths and touch targets; avoid shrinking secondary text below the existing small text scale.

## Interaction and state conventions

- Focus uses the existing WAVE purple outline with a visible offset.
- Filter changes replace the URL without an unnecessary page jump.
- Disabled data types are explicitly labeled as unavailable rather than silently omitted when the product needs to communicate roadmap status.
- Reduced-motion preferences disable decorative movement while preserving content and controls.
- Prototype banners and the WPI disclaimer remain visible at the point of decision, not only in a footer.
- Primary auth actions are pill-shaped like the landing CTA; secondary links use the same rounded focus target and underline-on-hover treatment.
- The WPI chart's reference series is toggled with a labeled pressed button; the validated index remains the always-visible primary series.

## Uizze research note

The focused Uizze research returned closest, not exact, related references for data-product structure: [LocalCan](https://uizze.com/packs/82a95bb4-76c0-4887-afc1-645fd687e343), [Binance](https://uizze.com/packs/46fae41d-ba0f-40b6-b8f5-a6b43bd9aef8), [Kobbe](https://uizze.com/packs/201ffce8-4fa5-45cd-9532-dfdb5a3c8271), [Linear](https://uizze.com/packs/4b66f12c-c30d-4448-a568-93713e347ed9), and [Supabase](https://uizze.com/packs/c5562abf-ddbf-4185-bebd-3f813e873462). Their useful lesson for WAVE is structural: keep the primary comparison task visually dominant, make navigation to deeper detail explicit, and use density selectively. A separate premium-auth query returned no match, so the auth composition remains grounded in WAVE's landing-page language and familiar form conventions. These are not source-of-truth references for WAVE's branding or exact layout, so no proprietary visual treatment is copied.

## Exceptions

- The current WPI snapshot is intentionally illustrative. Its fixed date and prototype banner are product-truth safeguards, not a temporary visual detail.
- Grade definitions remain provisional and must be approved by the business before they are presented as final market standards.
- The chart is a simple trend view rather than a trading-style chart; WPI is a reference index, not a financial terminal.
