import { PickerActivationPage } from "@/modules/auth/picker-activation-page"

type ActivationRouteProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ActivationRoute({
  searchParams,
}: ActivationRouteProps) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : ""
  return <PickerActivationPage inviteToken={token} />
}
