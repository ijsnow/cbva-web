import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"

import { db } from "@/db/connection"

async function readPools({
  tournamentDivisionId,
  ids,
}: {
  tournamentDivisionId: number
  ids?: []
}) {
  return await db._query.pools.findMany({
    with: {
      matches: {
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
      },
      teams: {
        with: {
          team: {
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
            },
          },
        },
        orderBy: (t, { asc }) => asc(t.seed),
      },
    },
    where: (t, { eq, and, inArray }) =>
      and(
        ...[
          eq(t.tournamentDivisionId, tournamentDivisionId),
          ids ? inArray(t.id, ids) : undefined,
        ].filter(Boolean)
      ),
    orderBy: (t, { asc }) => [asc(t.name)],
  })
}

export const getPools = createServerFn({
  method: "GET",
})
  .inputValidator(
    (i) =>
      i as {
        tournamentDivisionId: number
      }
  )
  .handler(async ({ data }) => await readPools(data))

export const poolsQueryOptions = ({
  tournamentDivisionId,
  ids,
}: {
  tournamentDivisionId: number
  ids?: number[]
}) =>
  queryOptions({
    queryKey: ["pools", tournamentDivisionId, ids ? ids.join() : null].filter(
      Boolean
    ),
    queryFn: () =>
      getPools({
        data: {
          tournamentDivisionId,
          ids,
        },
      }),
  })
