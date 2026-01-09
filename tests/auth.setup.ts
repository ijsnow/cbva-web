import { users } from "@/db/schema"
import { db } from "@/db/connection"
import { test as setup } from "@playwright/test"
import { eq } from "drizzle-orm"

const authDir = "playwright/.auth"

setup("create verified test user", async ({ page, request }) => {
  await request.post("/api/auth/sign-up/email", {
    data: {
      name: "Verified User",
      email: "verifieduser@example.com",
      phoneNumber: "+11111111111",
      password: "Password1!",
    },
  })

  await db
    .update(users)
    .set({
      emailVerified: true,
      phoneNumberVerified: true,
    })
    .where(eq(users.email, "verifieduser@example.com"))

  // const res = await request.post('/api/auth/sign-in/email', {
  //    data: {
  //      'email': 'verifieduser@example.com',
  //      'password': 'Password1!'
  //    }
  //  });

  // console.log(res)

  await page.goto("/log-in")

  await page
    .getByRole("textbox", { name: "Email*", exact: true })
    .fill("verifieduser@example.com")
  await page
    .getByRole("textbox", { name: "Password*", exact: true })
    .fill("Password1!")

  await page.getByRole("button", { name: "Log in" }).click()

  await page.waitForURL("**/account**")

  await page.context().storageState({ path: `${authDir}/verifieduser.json` })
})

setup("create unverified test user", async ({ page, request }) => {
  await request.post("/api/auth/sign-up/email", {
    data: {
      name: "Unverified User",
      email: "unverifieduser@example.com",
      phoneNumber: "+22222222222",
      password: "Password1!",
    },
  })
})
