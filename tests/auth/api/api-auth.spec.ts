import { expect, test } from "@playwright/test"

test("E-12 rejects an unauthenticated WhatsApp request", async ({
  request,
}) => {
  const response = await request.post("/api/whatsapp/send-receipt", {
    data: { transactionId: "unauthenticated-test" },
  })

  expect([401, 404]).toContain(response.status())
})
