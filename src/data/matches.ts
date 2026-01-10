import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"

import { eq } from "drizzle-orm"
import { db } from "@/db/connection"
import { poolMatches } from "@/db/schema"

export const getPoolMatch = createServerFn({
  method: "GET",
})
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data: { id } }) => {
    return await db._query.poolMatches.findFirst({
      where: eq(poolMatches.id, id),
      with: {
        sets: true,
        teamA: {
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
        teamB: {
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
        },
        pool: {
          with: {
            tournamentDivision: true,
          },
        },
      },
    })
  })

export const poolMatchQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["pool_match", id],
    queryFn: () => getPoolMatch({ data: { id } }),
  })

export const getPoolMatchSet = createServerFn({
  method: "GET",
})
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data: { id } }) => {
    return await db._query.matchSets.findFirst({
      where: eq(poolMatches.id, id),
      with: {
        poolMatch: {
          with: {
            teamA: {
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
            teamB: {
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
        },
      },
    })
  })

export const poolMatchSetQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["pool_match_set", id],
    queryFn: () => getPoolMatchSet({ data: { id } }),
  })

export const getPlayoffMatch = createServerFn({
  method: "GET",
})
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data: { id } }) => {
    return await db._query.playoffMatches.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        sets: true,
        tournamentDivision: {
          columns: { id: true, tournamentId: true },
        },
        teamA: {
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
        teamB: {
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
        },
      },
    })
  })

export const playoffMatchQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["playoff_match", id],
    queryFn: () => getPlayoffMatch({ data: { id } }),
  })
