import { db } from "@/db/connection"
import { matchRefTeams, selectMatchRefTeamSchema } from "@/db/schema"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import type z from "zod"

export const removeRefSchema = selectMatchRefTeamSchema.pick({
  id: true,
})

export const removeRef = createServerFn()
  .inputValidator(removeRefSchema)
  .handler(async ({ data: { id } }) => {
    await db.delete(matchRefTeams).where(eq(matchRefTeams.id, id))

    return {
      success: true,
    }
  })

export const removeRefMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof removeRefSchema>) => removeRef({ data }),
  })
