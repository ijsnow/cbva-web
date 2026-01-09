import { db } from "@/db/connection"
import { matchRefTeams, selectMatchRefTeamSchema } from "@/db/schema"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import type z from "zod"

export const undoAbandonRefSchema = selectMatchRefTeamSchema.pick({
  id: true,
})

export const undoAbandonRef = createServerFn()
  .inputValidator(undoAbandonRefSchema)
  .handler(async ({ data: { id } }) => {
    await db
      .update(matchRefTeams)
      .set({
        abandoned: false,
      })
      .where(eq(matchRefTeams.id, id))

    return {
      success: true,
    }
  })

export const undoAbandonRefMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof undoAbandonRefSchema>) =>
      undoAbandonRef({ data }),
  })
