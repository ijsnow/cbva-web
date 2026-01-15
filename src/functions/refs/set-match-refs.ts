import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchRefs } from "@/db/schema";
import { assertFound } from "@/lib/responses";
import { isNotNull } from "@/utils/types";
import z from "zod";

export const setMatchRefsSchema = z.object({
	poolMatchId: z.number().nullable().optional(),
	playoffMatchId: z.number().nullable().optional(),
	teamId: z.number().nullable().optional(),
	profileIds: z.array(z.number()),
});

export async function setMatchRefsHandler({
	data,
}: {
	data: z.infer<typeof setMatchRefsSchema>;
}) {
	console.log("setMatchRefsHandler", data);

	const { profileIds, teamId, playoffMatchId, poolMatchId } = data;

	const match = playoffMatchId
		? await db.query.playoffMatches.findFirst({
				where: { id: playoffMatchId },
			})
		: poolMatchId
			? await db.query.poolMatches.findFirst({
					where: { id: poolMatchId },
				})
			: undefined;

	assertFound(match);

	const filters = [
		playoffMatchId ? eq(matchRefs.playoffMatchId, playoffMatchId) : null,
		poolMatchId ? eq(matchRefs.poolMatchId, poolMatchId) : null,
	].filter(isNotNull);

	await db.delete(matchRefs).where(and(...filters));

	if (teamId) {
		const team = await db.query.tournamentDivisionTeams.findFirst({
			with: {
				players: {
					with: {
						profile: true,
					},
				},
			},
			where: {
				id: teamId,
			},
		});

		assertFound(team);

		await db.insert(matchRefs).values(
			team.players.map(({ profile: { id } }) => ({
				playoffMatchId,
				poolMatchId,
				teamId,
				profileId: id,
			})),
		);
	}

	if (profileIds.length > 0) {
		await db.insert(matchRefs).values(
			profileIds.map((profileId) => ({
				playoffMatchId,
				poolMatchId,
				teamId,
				profileId,
			})),
		);
	}

	return {
		success: true,
	};
}

export const setMatchRefsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setMatchRefsSchema)
	.handler(setMatchRefsHandler);

export const setMatchRefMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setMatchRefsSchema>) =>
			setMatchRefsFn({ data }),
	});
