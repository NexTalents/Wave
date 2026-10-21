# Auth module

The module provides a custom WAVE auth experience backed by Clerk and Convex. The UI does not render Clerk's prebuilt `SignIn` or `SignUp` components, so login and registration remain brandable and watermark-free.

## Setup

Add these values to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex deployment environment. The value is the Clerk Frontend API URL used by the Convex integration.

Enable email/password and email verification in Clerk. Google and Apple buttons are available on `/login` when those social connections are enabled in the Clerk Dashboard.

Routes:

- `/login` — custom email/password and social login
- `/register` — individual or business registration
- `/verify` — email verification and MFA verification
- `/sso-callback` — Clerk OAuth callback without a visible Clerk UI

Business registration stores the account type and creates a pending Convex organization with the registering user as owner after email verification. Individual registration creates only the user profile.

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

## Client API

Use `useCurrentUser` after the provider is mounted. It creates the local Convex profile the first time an authenticated Clerk session is seen.

```tsx
import { useCurrentUser } from "@/modules/auth"

const user = useCurrentUser()
```

## Convex API

Organization-scoped mutations should derive the actor from the session and check the permission before changing data:

```ts
import { requirePermission } from "../auth/authorization"
import { permissions } from "../../modules/auth/permissions"

const actor = await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
```

Do not accept a user ID from the client for authorization, and do not use a UI guard as a security check. The Convex function is the enforcement point.
