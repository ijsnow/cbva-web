import { db } from "@/db/connection"
import { matchRefTeams, selectMatchRefTeamSchema } from "@/db/schema"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import type z from "zod"

export const abandonRefSchema = selectMatchRefTeamSchema.pick({
  id: true,
})

export const abandonRef = createServerFn()
  .inputValidator(abandonRefSchema)
  .handler(async ({ data: { id } }) => {
    await db
      .update(matchRefTeams)
      .set({
        abandoned: true,
      })
      .where(eq(matchRefTeams.id, id))

    return {
      success: true,
    }
  })

export const abandonRefMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof abandonRefSchema>) =>
      abandonRef({ data }),
  })
