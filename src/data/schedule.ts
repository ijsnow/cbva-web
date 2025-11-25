import { type CalendarDate, parseDate } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateTournament,
	type CreateTournamentDirector,
	type CreateTournamentDivision,
	createTournamentSchema,
	type Director,
	selectTournamentSchema,
	type Tournament,
	type TournamentDirector,
	type TournamentDivision,
	tournamentDirectors,
	tournamentDivisions,
	tournaments,
	type Venue,
} from "@/db/schema";

async function duplicateTournaments(
	templates: (Tournament & {
		tournamentDivisions: TournamentDivision[];
		directors: TournamentDirector[];
		venue: Venue;
	})[],
	getDate: (curr: CalendarDate) => string,
) {
	const values = templates
		.map((template) =>
			createTournamentSchema
				.pick({
					name: true,
					date: true,
					startTime: true,
					venueId: true,
				})
				.parse(template),
		)
		.map((values) => ({
			...values,
			date: getDate(parseDate(values.date)),
		}));

	const createdTournaments = await db
		.insert(tournaments)
		.values(values)
		.returning({
			id: tournaments.id,
		});

	if (createdTournaments.length !== templates.length) {
		throw new Error(
			"Received different length. Something went wrong with creation",
		);
	}

	const zipped = createdTournaments.map(({ id }, i) => ({
		id,
		template: templates[i],
	}));

	const divisionValues: CreateTournamentDivision[] = zipped.flatMap(
		({ id, template }) =>
			template.tournamentDivisions.map(
				({ divisionId, gender, name, teamSize }) => ({
					tournamentId: id,
					divisionId,
					gender,
					name,
					teamSize,
				}),
			),
	);

	const directorValues: CreateTournamentDirector[] = zipped.flatMap(
		({ id, template }) =>
			template.directors.map(({ directorId, order }) => ({
				tournamentId: id,
				directorId,
				order,
			})),
	);

	await Promise.all([
		db.insert(tournamentDivisions).values(divisionValues),
		db.insert(tournamentDirectors).values(directorValues),
	]);

	return createdTournaments;
}

const duplicateTournamentSchema = selectTournamentSchema.pick({
	id: true,
	date: true,
});

type DuplicateTournamentParams = z.infer<typeof duplicateTournamentSchema>;

export const duplicateTournamentFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["create"],
		}),
	])
	.inputValidator(duplicateTournamentSchema)
	.handler(async ({ data: { id, date } }) => {
		const template = await db.query.tournaments.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			with: {
				venue: true,
				directors: true,
				tournamentDivisions: true,
			},
		});

		if (!template) {
			throw notFound();
		}

		const [tournament] = await duplicateTournaments([template], () => date);

		// const values = createTournamentSchema
		// 	.pick({
		// 		name: true,
		// 		startTime: true,
		// 		venueId: true,
		// 	})
		// 	.parse(template);

		// const [tournament] = await db
		// 	.insert(tournaments)
		// 	.values({
		// 		...values,
		// 		date,
		// 	})
		// 	.returning({
		// 		id: tournaments.id,
		// 	});

		// const divisionValues: CreateTournamentDivision[] =
		// 	template.tournamentDivisions.map(
		// 		({ divisionId, gender, name, teamSize }) => ({
		// 			tournamentId: tournament.id,
		// 			divisionId,
		// 			gender,
		// 			name,
		// 			teamSize,
		// 		}),
		// 	);

		// const directorValues: CreateTournamentDirector[] = template.directors.map(
		// 	({ directorId, order }) => ({
		// 		tournamentId: tournament.id,
		// 		directorId,
		// 		order,
		// 	}),
		// );

		// await Promise.all([
		// 	db.insert(tournamentDivisions).values(divisionValues),
		// 	db.insert(tournamentDirectors).values(directorValues),
		// ]);

		return { data: tournament };
	});

export const duplicateTournamentOptions = () =>
	mutationOptions({
		mutationFn: async (data: DuplicateTournamentParams) => {
			return duplicateTournamentFn({ data });
		},
	});

const copyScheduleSchema = z.object({
	sourceYear: z.number(),
	days: z.number(),
});

export const copyScheduleFn = createServerFn()
	.inputValidator(copyScheduleSchema)
	.handler(async ({ data: { sourceYear, days } }) => {
		// consider doing this all at once using $with
		//
		// https://orm.drizzle.team/docs/insert#with-insert-clause
		const tournaments = await db.query.tournaments.findMany({
			with: {
				venue: true,
				directors: true,
				tournamentDivisions: true,
			},
			where: (t, { gte, lte, and }) =>
				and(
					gte(t.date, `${sourceYear}-01-01`),
					lte(t.date, `${sourceYear}-12-31`),
				),
		});

		const created = await duplicateTournaments(tournaments, (date) =>
			date.add({ days }).toString(),
		);

		return created;
	});
