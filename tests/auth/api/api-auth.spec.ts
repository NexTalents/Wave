import { expect, test } from "@playwright/test"

test("E-12 rejects an unauthenticated WhatsApp request", async ({
  request,
}) => {
  const response = await request.post("/api/whatsapp/send-receipt", {
    data: { transactionId: "unauthenticated-test" },
  })

  expect(response.status()).toBe(401)
})

test("E-12b rejects an unauthenticated AI analysis request", async ({
  request,
}) => {
  const response = await request.post("/api/analyze-waste", {
    multipart: {
      image: {
        name: "sample.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("not-a-real-image"),
      },
    },
  })

  expect(response.status()).toBe(401)
})
