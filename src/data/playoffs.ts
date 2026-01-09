import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db/connection"

async function readPlayoffs({
  tournamentDivisionId,
}: {
  tournamentDivisionId: number
}) {
  return await db.query.playoffMatches.findMany({
    with: {
      sets: true,
      teamA: {
        with: {
          poolTeam: {
            with: {
              pool: true,
            },
          },
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
        },
      },
      teamB: {
        with: {
          poolTeam: {
            with: {
              pool: true,
            },
          },
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
        },
      },
      refTeams: {
        with: {
          team: {
            with: {
              team: {
                with: {
                  players: {
                    with: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: (t, { or, isNull, eq }) =>
          or(isNull(t.abandoned), eq(t.abandoned, false)),
      },
    },
    where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    orderBy: (t, { asc }) => asc(t.matchNumber),
  })
}

export const getPlayoffs = createServerFn({
  method: "GET",
})
  .inputValidator(
    (i) =>
      i as {
        tournamentDivisionId: number
      }
  )
  .handler(async ({ data }) => await readPlayoffs(data))

export const playoffsQueryOptions = ({
  tournamentDivisionId,
}: {
  tournamentDivisionId: number
}) =>
  queryOptions({
    queryKey: ["playoffs", tournamentDivisionId].filter(Boolean),
    queryFn: () =>
      getPlayoffs({
        data: {
          tournamentDivisionId,
        },
      }),
  })
