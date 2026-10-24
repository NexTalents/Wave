# WAVE Landing Page Module

Reusable landing-page UI for Wave. The page is intentionally isolated under this directory so the host app only needs to mount the module and load its styles.

## Mount

```tsx
import { LandingPage } from "@/modules/landing-page"

export default function Page() {
  return <LandingPage />
}
```

## Configuration

Edit `config.ts` for the landing-page UI configuration:

- `site`: navigation, footer links, contact details, and social links.
- `home`: section copy, CTA routes, product items, business slides, founder quote, and testimonials.
- `homeAssets`: remote image and video sources, including mobile-specific scene assets.

The section components are presentational and consume this centralized configuration, so content and asset changes do not require editing the motion/layout components.

## Structure

- `landing-page.tsx`: module shell and section composition.
- `pages/about-us.tsx`: About Us page composition within the landing-page module.
- `pages/wpi.tsx`: public Waste Price Index page composition within the landing-page module.
- `components/home`: hero, inclusive-growth motion, product, business, founder, and testimonial sections.
- `components/layout`: header, footer, and page container.
- `components/motion`: scroll progress and smooth-scroll behavior.
- `components/primitives`: links and disclosure UI.
- `styles.css`: WAVE design tokens, responsive breakpoint, and module animations.
- `index.ts`: public module entry point.
WPI public pages live in `modules/wpi` and are routed from `app/wpi`.
