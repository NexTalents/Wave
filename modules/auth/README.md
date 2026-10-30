# Auth module

The module provides a custom WAVE auth experience backed by Clerk and Convex. The UI does not render Clerk's prebuilt `SignIn` or `SignUp` components, so login and registration remain brandable and watermark-free.

## Setup

Copy `.env.example` to `.env.local`, then fill the local Clerk and Convex values:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

`CLERK_SECRET_KEY` is server-only and must never be exposed to client code or committed. The four redirect variables keep Clerk's server redirects on the custom WAVE routes.

Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex deployment environment, not in the browser environment. The value must be the Clerk Frontend API URL used by the Convex integration:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN <Clerk-Frontend-API-URL>
```

Verify it with `npx convex env list` without copying the value into documentation. Do not change a production deployment without explicit approval.

Enable Clerk's Convex integration or create a Clerk JWT template named `convex`. `ConvexProviderWithClerk` requests that token template when the integration is not active; without it, Clerk can show a signed-in session while Convex still sees the request as unauthenticated.

Enable email/password in Clerk. Email verification may remain enabled for production, but can be disabled in the Development instance for local end-to-end tests. Google and Apple buttons are available on `/login` when those social connections are enabled in the Clerk Dashboard.

For local auth testing, configure the Clerk Development instance with the `convex` JWT template/integration and allow `http://localhost:3000/sso-callback`. Keep `WAVE_TEST_*` credentials in `.env` or CI secrets only; never put them in `.env.example` with real values.

Routes:

- `/login` — custom email/password and social login
- `/register` — individual or business registration
- `/verify` — email verification and MFA verification
- `/sso-callback` — Clerk OAuth callback without a visible Clerk UI

Business registration stores the account type and creates a pending Convex organization with the registering user as owner. Individual registration creates only the user profile.

## Bootstrap platform admin

Admin access is granted only to an existing, already-synchronized Convex user. After that user has signed in once and `syncProfile` has created the profile, run the internal mutation from the Convex CLI:

```bash
npx convex run auth/admin:grantPlatformAdmin '{"email":"admin@example.com"}'
```

The command is internal and is not exposed through the public `api`. It does not create a Clerk account. Use the exact email from the Clerk profile, keep the command out of application code, and use `revokePlatformAdmin` to remove the role.

## Session state and route guards

Wrap only the part of the app that needs authentication:

```tsx
import { AuthProvider } from "@/modules/auth"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
```

Use `useAuthState` when a component needs the session state. The state distinguishes a signed-out user, a Clerk session that Convex cannot authenticate, profile synchronization, onboarding, suspension, and a ready session.

```tsx
import { useAuthState } from "@/modules/auth"

export function PrivatePanel() {
  const state = useAuthState()
  if (state.status !== "ready") return null
  return <p>Halo, {state.user.firstName ?? "pengguna"}.</p>
}
```

Use `RoleGuard` in dashboard layouts. Its redirect is only a client navigation aid; it is not a security boundary.

```tsx
import { RoleGuard } from "@/modules/auth"

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allow={["business"]}>{children}</RoleGuard>
}
```

Business screens can read the active organization selected by `me`:

```tsx
import { useActiveOrganization } from "@/modules/auth"

const organization = useActiveOrganization()
```

Use `useSignOut` for custom sign-out buttons. It redirects to `/login`, exposes a loading state, and prevents duplicate clicks:

```tsx
import { useSignOut } from "@/modules/auth"

const { isSigningOut, signOut } = useSignOut()
```

New business modules should add a permission to `permissions.ts` only when the feature exists, then call the Convex authorization helper before reading or writing organization data.

## Convex API

Organization-scoped mutations should derive the actor from the session and check the permission before changing data:

```ts
import { requirePermission } from "../auth/authorization"
import { permissions } from "../../modules/auth/permissions"

const actor = await requirePermission(
  ctx,
  args.organizationId,
  permissions.depositsCreate
)
```

Do not accept a user ID from the client for authorization, and do not use a UI guard as a security check. The Convex function is the enforcement point.
