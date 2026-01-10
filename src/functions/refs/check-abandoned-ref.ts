import { db } from "@/db/connection"
import { selectTournamentDivisionTeamSchema } from "@/db/schema"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"

export const checkAbandonedRefSchema = selectTournamentDivisionTeamSchema.pick({
  id: true,
})

export const checkAbandonedRef = createServerFn()
  .inputValidator(checkAbandonedRefSchema)
  .handler(async ({ data: { id: tournamentDivisionTeamId } }) => {
    const result = await db._query.matchRefTeams.findFirst({
      columns: {
        id: true,
      },
      where: (t, { eq, and }) =>
        and(eq(t.teamId, tournamentDivisionTeamId), eq(t.abandoned, true)),
    })

    return result?.id ?? null
  })

export const checkAbandonedRefQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["checkAbandonedRef", id],
    queryFn: () => checkAbandonedRef({ data: { id } }),
  })
