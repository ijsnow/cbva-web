import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import z from "zod"
import { db } from "@/db/connection"
import { selectTournamentDivisionTeamSchema } from "@/db/schema"
import { teamStatusSchema } from "@/db/schema/shared"
import { isNotNull, isNotNullOrUndefined } from "@/utils/types"
import {
  authMiddleware,
  roleHasPermission,
  type SessionViewer,
} from "@/auth/shared"

const getTeamsSchema = selectTournamentDivisionTeamSchema
  .pick({ tournamentDivisionId: true })
  .extend({
    statusIn: z.array(teamStatusSchema).optional(),
  })

async function readTeams(
  { tournamentDivisionId, statusIn }: z.infer<typeof getTeamsSchema>,
  viewer: SessionViewer | undefined
) {
  const canUpdate = viewer
    ? roleHasPermission(viewer.role, {
        tournament: ["update"],
      })
    : false

  return await db._query.tournamentDivisionTeams.findMany({
    with: {
      team: {
        with: {
          players: {
            with: {
              profile: {
                with: {
                  level: true,
                },
              },
            },
          },
        },
      },
      poolTeam: {
        with: {
          pool: true,
        },
      },
    },
    where: (t, { eq, and, or, inArray }) =>
      and(
        eq(t.tournamentDivisionId, tournamentDivisionId),
        inArray(
          t.status,
          statusIn ??
            [
              "confirmed" as const,
              "registered" as const,
              canUpdate ? ("waitlisted" as const) : null,
            ].filter(isNotNull)
        )
        // statusIn
        // 	? inArray(t.status, statusIn)
        // 	: or(eq(t.status, "confirmed"), eq(t.status, "registered")),
      ),
    orderBy: (t, { asc }) => [asc(t.finish), asc(t.seed)],
  })
}

export const getTeams = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .inputValidator(getTeamsSchema)
  .handler(
    async ({ data, context: { viewer } }) => await readTeams(data, viewer)
  )

export const teamsQueryOptions = ({
  tournamentDivisionId,
  statusIn,
}: z.infer<typeof getTeamsSchema>) =>
  queryOptions({
    queryKey: ["teams", tournamentDivisionId, statusIn?.join(":")].filter(
      isNotNullOrUndefined
    ),
    queryFn: () =>
      getTeams({
        data: {
          tournamentDivisionId,
          statusIn,
        },
      }),
  })
