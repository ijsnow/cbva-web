import { getMockDb } from "./db"
import { startApp } from "./server"

const { url } = await getMockDb()

await startApp(url)
