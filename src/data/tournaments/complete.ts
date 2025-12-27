import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { selectTournamentDivisionSchema } from "@/db/schema";

export const completeTournamentDivisionSchema =
	selectTournamentDivisionSchema.pick({
		id: true,
	});

export const completeTournamentDivisionFn = createServerFn()
	.inputValidator(completeTournamentDivisionSchema)
	.handler(({ data: { id: tournamentDivisionId } }) => {
		console.log("CompleteTournament.Division", tournamentDivisionId);

		return {
			success: true,
		};
	});

export const completeTournamentDivisionMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof completeTournamentDivisionSchema>) =>
			completeTournamentDivisionFn({ data }),
	});
