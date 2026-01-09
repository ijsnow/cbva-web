import { test } from "vitest"
import { getMockDb } from "./db"
import { startApp } from "./server"

test("can start app in testcontainer", async () => {
  const { url } = await getMockDb()

  await startApp(url)
})
