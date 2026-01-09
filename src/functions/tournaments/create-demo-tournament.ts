import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type z from "zod"
import { requirePermissions } from "@/auth/shared"
import { selectTournamentSchema } from "@/db/schema"
import { duplicateTournamentFn } from "@/data/schedule"
import { today } from "@internationalized/date"
import { getDefaultTimeZone } from "@/lib/dates"

export const createDemoTournamentSchema = selectTournamentSchema.pick({
  id: true,
})

export const createDemoTournament = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createDemoTournamentSchema)
  .handler(async ({ data: { id } }) => {
    const res = await duplicateTournamentFn({
      data: {
        id,
        date: today(getDefaultTimeZone()).toString(),
        demo: true,
      },
    })

    return {
      success: true,
      ...res,
    }
  })

export const createDemoTournamentMuationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createDemoTournamentSchema>) =>
      createDemoTournament({ data }),
  })
