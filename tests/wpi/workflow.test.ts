import assert from "node:assert/strict"
import test from "node:test"
import {
  buildObservationFingerprint,
  canCompareSnapshot,
  canSubmitObservation,
  hasPlatformAdminRole,
  isOrganizationScope,
  publishTransition,
  reviewTransition,
  validateObservationSubmission,
} from "../../convex/wpi/workflow.ts"

test("P3-TEST-01 rejection requires a reason and changes state", () => {
  assert.throws(
    () => reviewTransition("submitted", "reject"),
    /reason is required/
  )
  assert.deepEqual(
    reviewTransition("submitted", "reject", "Evidence tidak cukup"),
    { status: "rejected", reason: "Evidence tidak cukup" }
  )
})

test("P3-TEST-02 approval only moves a reviewable observation to eligible", () => {
  assert.deepEqual(reviewTransition("validated", "approve"), {
    status: "eligible",
    reason: undefined,
  })
  assert.throws(() => reviewTransition("used", "approve"), /not reviewable/)
})

test("P3-TEST-03 through P3-TEST-05 business roles and admin boundaries are explicit", () => {
  assert.equal(canSubmitObservation("operator"), true)
  assert.equal(canSubmitObservation("buyer"), false)
  assert.equal(canSubmitObservation("data_viewer"), false)
})

test("P4-TEST-01 valid comparable snapshot matches all dimensions", () => {
  assert.equal(
    canCompareSnapshot(
      { dataQuality: "verified", materialId: "m", gradeId: "g", regionId: "r" },
      { materialId: "m", gradeId: "g", regionId: "r" }
    ),
    true
  )
})

test("P4-TEST-02 through P4-TEST-04 reject mismatched or insufficient business comparisons", () => {
  assert.equal(
    canCompareSnapshot(
      {
        dataQuality: "verified",
        materialId: "m",
        gradeId: "other",
        regionId: "r",
      },
      { materialId: "m", gradeId: "g", regionId: "r" }
    ),
    false
  )
  assert.equal(
    canCompareSnapshot(
      {
        dataQuality: "insufficient_data",
        materialId: "m",
        gradeId: "g",
        regionId: "r",
      },
      { materialId: "m", gradeId: "g", regionId: "r" }
    ),
    false
  )
})

test("P3-TEST-03 and P3-TEST-04 only publish candidate snapshots", () => {
  assert.equal(publishTransition("candidate"), "published")
  assert.throws(() => publishTransition("published"), /candidate snapshots/)
  assert.throws(() => publishTransition("superseded"), /candidate snapshots/)
})

test("P3-TEST-05 platform admin boundary is explicit", () => {
  assert.equal(hasPlatformAdminRole("admin"), true)
  assert.equal(hasPlatformAdminRole(undefined), false)
})

test("P4-TEST-02 server submission validation rejects unsafe values", () => {
  assert.equal(
    validateObservationSubmission({
      pricePerKgIdr: 125000,
      quantityGrams: 2500,
      observedAt: 100,
      now: 100,
    }),
    true
  )
  assert.throws(
    () =>
      validateObservationSubmission({
        pricePerKgIdr: 0,
        observedAt: 100,
        now: 100,
      }),
    /positive IDR integer/
  )
  assert.throws(
    () =>
      validateObservationSubmission({
        pricePerKgIdr: 125000,
        observedAt: 101,
        now: 100,
      }),
    /future/
  )
})

test("P4-TEST-04 organization scope cannot cross membership boundary", () => {
  assert.equal(isOrganizationScope("org-a", "org-a"), true)
  assert.equal(isOrganizationScope("org-a", "org-b"), false)
})

test("P4-TEST-01 observation fingerprints are deterministic", () => {
  const input = {
    organizationId: "org-a",
    sourceId: "source-a",
    materialId: "material-a",
    gradeId: "grade-a",
    regionId: "region-a",
    observedAt: 100,
    pricePerKgIdr: 125000,
    quantityGrams: 2500,
  }
  assert.equal(
    buildObservationFingerprint(input),
    buildObservationFingerprint(input)
  )
  assert.notEqual(
    buildObservationFingerprint(input),
    buildObservationFingerprint({ ...input, pricePerKgIdr: 126000 })
  )
})
