import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateTournamentDirector,
	createTournamentDirectorSchema,
	tournamentDirectors,
} from "@/db/schema";

async function readDirectors() {
	return await db.query.directors.findMany({
		with: {
			profile: true,
		},
	});
}

const getDirectors = createServerFn({
	method: "GET",
}).handler(() => readDirectors());

export const directorsQueryOptions = () =>
	queryOptions({
		queryKey: ["directors"],
		queryFn: () => getDirectors(),
	});

export const insertTournamentDirectorFn = createServerFn({ method: "POST" })
	.inputValidator(createTournamentDirectorSchema)
	.handler(async ({ data }) => {
		const [res] = await db.insert(tournamentDirectors).values(data).returning({
			id: tournamentDirectors.id,
		});

		const created = await db.query.tournamentDirectors.findFirst({
			where: (t, { eq }) => eq(t.id, res.id),
			with: {
				director: {
					with: {
						profile: true,
					},
				},
			},
		});

		if (!created) {
			throw new Error("Expected to find newly created TournamentDirector.");
		}

		return created;
	});

export function useInsertTournamentDirector() {
	const mutationFn = useServerFn(insertTournamentDirectorFn);
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateTournamentDirector) => {
			return mutationFn({ data: input });
		},
		onSuccess: (_, input) => {
			client.invalidateQueries({
				queryKey: ["tournament", input.tournamentId],
			});
		},
	});
}

export const deleteTournamentDirectorFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(
		({ id, tournamentId }: { id: number; tournamentId: number }) => ({
			id,
			tournamentId,
		}),
	)
	.handler(async ({ data }) => {
		const remainingDirectors = await db
			.select()
			.from(tournamentDirectors)
			.where(eq(tournamentDirectors.tournamentId, data.tournamentId));

		console.log("here", remainingDirectors.length);

		if (remainingDirectors.length <= 1) {
			throw new Error(
				"Cannot delete the last tournament director for a tournament",
			);
		}

		await db
			.delete(tournamentDirectors)
			.where(eq(tournamentDirectors.id, data.id));
	});

export function useDeleteTournamentDirector() {
	const mutationFn = useServerFn(deleteTournamentDirectorFn);
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (input: { id: number; tournamentId: number }) => {
			return mutationFn({ data: input });
		},
		onSuccess: (_, input) => {
			client.invalidateQueries({
				queryKey: ["tournament", input.tournamentId],
			});
		},
	});
}
