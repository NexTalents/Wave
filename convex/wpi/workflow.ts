export type ReviewState =
  "submitted" | "validated" | "rejected" | "quarantined" | "eligible" | "used"
export type ReviewDecision = "approve" | "reject" | "quarantine"
export type BusinessRole =
  "owner" | "admin" | "operator" | "aggregator" | "buyer" | "data_viewer"

export function hasPlatformAdminRole(role?: "admin") {
  return role === "admin"
}

export function isOrganizationScope(
  requestedOrganizationId: string,
  memberOrganizationId: string
) {
  return requestedOrganizationId === memberOrganizationId
}

export function validateObservationSubmission(args: {
  pricePerKgIdr: number
  quantityGrams?: number
  observedAt: number
  now: number
}) {
  if (!Number.isSafeInteger(args.pricePerKgIdr) || args.pricePerKgIdr <= 0)
    throw new Error("Price must be a positive IDR integer")
  if (
    args.quantityGrams !== undefined &&
    (!Number.isSafeInteger(args.quantityGrams) || args.quantityGrams <= 0)
  )
    throw new Error("Quantity must be a positive gram integer")
  if (args.observedAt > args.now)
    throw new Error("Observation date cannot be in the future")
  return true
}

export function buildObservationFingerprint(args: {
  organizationId: string
  sourceId: string
  materialId: string
  gradeId: string
  regionId: string
  observedAt: number
  pricePerKgIdr: number
  quantityGrams?: number
}) {
  return [
    args.organizationId,
    args.sourceId,
    args.materialId,
    args.gradeId,
    args.regionId,
    args.observedAt,
    args.pricePerKgIdr,
    args.quantityGrams ?? "",
  ].join(":")
}

export function publishTransition(
  status: "candidate" | "published" | "superseded"
) {
  if (status !== "candidate")
    throw new Error("Only candidate snapshots can be published")
  return "published" as const
}

export function reviewTransition(
  current: ReviewState,
  decision: ReviewDecision,
  reason?: string
) {
  if (current !== "submitted" && current !== "validated")
    throw new Error("Observation is not reviewable")
  const trimmedReason = reason?.trim()
  if ((decision === "reject" || decision === "quarantine") && !trimmedReason)
    throw new Error("Review reason is required")
  return {
    status:
      decision === "approve"
        ? ("eligible" as const)
        : decision === "reject"
          ? ("rejected" as const)
          : ("quarantined" as const),
    reason: trimmedReason,
  }
}

export function canSubmitObservation(role: BusinessRole) {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "operator" ||
    role === "aggregator"
  )
}

export function canCompareSnapshot(
  snapshot: {
    dataQuality: string
    materialId: string
    gradeId: string
    regionId: string
  },
  scope: { materialId: string; gradeId: string; regionId: string }
) {
  return (
    snapshot.dataQuality !== "insufficient_data" &&
    snapshot.materialId === scope.materialId &&
    snapshot.gradeId === scope.gradeId &&
    snapshot.regionId === scope.regionId
  )
}
