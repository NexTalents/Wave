# Auth module

The module provides one Clerk + Convex provider and a small permission contract for authenticated WAVE features.

## Setup

Add these values to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex deployment environment. The value is the Clerk Frontend API URL used by the Convex integration.

## Use in an authenticated area

Wrap only the part of the app that needs authentication:

```tsx
import { AuthProvider } from "@/modules/auth"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
```

Use `RequireAuth` for presentation. It is not a security boundary; Convex functions must enforce permissions on the server.

```tsx
import { RequireAuth } from "@/modules/auth"

export function PrivatePanel() {
  return <RequireAuth fallback={<p>Silakan masuk.</p>}>{/* private UI */}</RequireAuth>
}
```

New business modules should add a permission to `permissions.ts` only when the feature exists, then call the Convex authorization helper before reading or writing organization data.
