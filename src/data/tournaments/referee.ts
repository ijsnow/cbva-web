import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import z from "zod"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import { matchRefTeams, selectPlayoffMatchSchema } from "@/db/schema"
import { notFound } from "@/lib/responses"

export const editPlayoffMatchRefTeamSchema = selectPlayoffMatchSchema
  .pick({
    id: true,
  })
  .extend({
    teamId: z.number(),
  })

export const editPlayoffMatchRefTeamFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(editPlayoffMatchRefTeamSchema)
  .handler(async ({ data: { id: matchId, teamId } }) => {
    const match = await db.query.playoffMatches.findFirst({
      where: (t, { eq }) => eq(t.id, matchId),
    })

    if (!match) {
      throw notFound()
    }

    await db
      .delete(matchRefTeams)
      .where(eq(matchRefTeams.playoffMatchId, matchId))

    await db.insert(matchRefTeams).values({
      playoffMatchId: matchId,
      teamId,
    })

    return {
      success: true,
    }
  })

export const editPlayoffMatchRefTeamMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof editPlayoffMatchRefTeamSchema>) =>
      editPlayoffMatchRefTeamFn({ data }),
  })

export const editPoolMatchRefTeamSchema = selectPlayoffMatchSchema
  .pick({
    id: true,
  })
  .extend({
    teamId: z.number(),
  })

export const editPoolMatchRefTeamFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(editPoolMatchRefTeamSchema)
  .handler(async ({ data: { id: matchId, teamId } }) => {
    const match = await db.query.poolMatches.findFirst({
      where: (t, { eq }) => eq(t.id, matchId),
    })

    if (!match) {
      throw notFound()
    }

    await db.delete(matchRefTeams).where(eq(matchRefTeams.poolMatchId, matchId))

    await db.insert(matchRefTeams).values({
      poolMatchId: matchId,
      teamId,
    })

    return {
      success: true,
    }
  })

export const editPoolMatchRefTeamMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof editPlayoffMatchRefTeamSchema>) =>
      editPlayoffMatchRefTeamFn({ data }),
  })
