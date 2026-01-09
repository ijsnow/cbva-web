import { createMiddleware } from "@tanstack/react-start"
import { drizzle } from "drizzle-orm/node-postgres"
import {
  type IRateLimiterOptions,
  RateLimiterDrizzle,
  type RateLimiterRes,
} from "rate-limiter-flexible"
import { getViewer } from "@/auth/server"
import { rateLimiterFlexibleSchema } from "@/db/schema"
import { internalServerError, tooManyRequests } from "./responses"
import { db } from "@/db/connection"

// Limit example: allow 10 signed upload URLs per minute, with burst up to 5 at once.

export const rateLimitMiddleware = ({
  keyPrefix,
  points,
  duration,
  blockDuration,
}: Pick<
  IRateLimiterOptions,
  "keyPrefix" | "points" | "duration" | "blockDuration"
>) =>
  createMiddleware().server(async ({ next }) => {
    const rateLimiter = new RateLimiterDrizzle({
      storeClient: db,
      schema: rateLimiterFlexibleSchema,
      keyPrefix,
      points,
      duration,
      blockDuration,
    })

    const viewer = await getViewer()

    try {
      await rateLimiter.consume(viewer.id, 1)

      return next()
    } catch (rejection) {
      if (rejection instanceof Error) {
        throw internalServerError(rejection.message)
      }

      const result = rejection as RateLimiterRes

      const retrySecs = Math.round(result.msBeforeNext / 1000) || 1

      throw tooManyRequests(retrySecs)
    }
  })
