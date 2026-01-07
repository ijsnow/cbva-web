import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchRefTeams, selectMatchRefTeamSchema } from "@/db/schema";
import { notFound } from "@/lib/responses";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";
import z from "zod";

export const editMatchRefTeamSchema = z
	.object({
		poolMatchId: z.number().nullable().optional(),
		playoffMatchId: z.number().nullable().optional(),
		teamId: z.number().nullable().optional(),
	})
	.refine(
		(data) =>
			isNotNullOrUndefined(data.playoffMatchId) !==
			isNotNullOrUndefined(data.poolMatchId),
		{
			message:
				"Exactly one of poolMatchId or playoffMatchId must be provided, not both or neither",
		},
	);

export async function editMatchRefTeamHandler({
	data,
}: {
	data: z.infer<typeof editMatchRefTeamSchema>;
}) {
	const { teamId, playoffMatchId, poolMatchId } = data;

	const match = playoffMatchId
		? await db.query.playoffMatches.findFirst({
				where: (t, { eq }) => eq(t.id, playoffMatchId),
			})
		: poolMatchId
			? await db.query.poolMatches.findFirst({
					where: (t, { eq }) => eq(t.id, poolMatchId),
				})
			: undefined;

	if (!match) {
		throw notFound();
	}

	const filters = [
		playoffMatchId ? eq(matchRefTeams.playoffMatchId, playoffMatchId) : null,
		poolMatchId ? eq(matchRefTeams.poolMatchId, poolMatchId) : null,
	].filter(isNotNull);

	await db.delete(matchRefTeams).where(and(...filters));

	if (teamId) {
		await db.insert(matchRefTeams).values({
			playoffMatchId,
			poolMatchId,
			teamId,
		});
	}

	return {
		success: true,
	};
}

export const editMatchRefTeamFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(editMatchRefTeamSchema)
	.handler(editMatchRefTeamHandler);

export const editMatchRefTeamMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editMatchRefTeamSchema>) =>
			editMatchRefTeamFn({ data }),
	});
