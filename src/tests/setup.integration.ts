import type { MailDataRequired } from "@sendgrid/mail"
import { vi } from "vitest"

vi.mock("@/db/connection", async () => {
  const { getMockDb } = await import("@/tests/db")

  return await getMockDb()
})

vi.mock("@/services/email", () => {
  return {
    sendSms: (message: MailDataRequired) => {
      console.log(message)
    },
  }
})

vi.mock("@/services/sms", () => {
  return {
    sendSms: (to: string, message: string) => {
      console.log({ to, message })
    },
  }
})
