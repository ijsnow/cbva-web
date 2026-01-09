import "dotenv/config"

import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
} from "@tanstack/react-start/server"
import { initSentry } from "./services/sentry"

initSentry()

const customHandler = defineHandlerCallback((ctx) => {
  return defaultStreamHandler(ctx)
})

const fetch = createStartHandler(customHandler)

export default {
  fetch,
}
