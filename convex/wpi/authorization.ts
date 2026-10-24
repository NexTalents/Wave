import type { AuthCtx } from "../auth/authorization"
import { requireUser } from "../auth/authorization"
import { hasPlatformAdminRole } from "./workflow"

export async function requirePlatformAdmin(ctx: AuthCtx) {
  const user = await requireUser(ctx)
  if (!hasPlatformAdminRole(user.platformRole))
    throw new Error("Platform administrator permission required")
  return user
}
