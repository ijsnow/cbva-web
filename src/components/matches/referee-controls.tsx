import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import {
	startMatchMutationOptions,
	undoSetCompletedMutationOptions,
} from "@/data/tournaments/matches";
import type { MatchSet, PoolMatch } from "@/db/schema";
import { Button } from "../base/button";
import { title } from "../base/primitives";
import { SideSwitchModal } from "./side-switch";

export function RefereeControls({
	// match,
	set,
	queryKey,
}: {
	match: PoolMatch;
	set: MatchSet;
	queryKey: QueryKey;
}) {
	// TODO: isOnReffingTeam
	// TODO: isScoreKeeper

	const queryClient = useQueryClient();

	const { mutate: startMatch } = useMutation({
		...startMatchMutationOptions({ id: set.id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey,
			});
		},
	});

	const { mutate: undoCompleted } = useMutation({
		...undoSetCompletedMutationOptions({ id: set.id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey,
			});
		},
	});

	return (
		<div className="w-full max-w-xl mx-auto rounded-lg bg-white border border-gray-700 p-3 flex flex-col items-start space-y-3">
			<h3 className={title({ size: "xs" })}>Referee Controls</h3>

			{set.status === "not_started" && (
				<Button onPress={() => startMatch()}>Start</Button>
			)}

			{set.status === "completed" && (
				<Button onPress={() => undoCompleted()}>Undo</Button>
			)}

			{set.status === "in_progress" && <SideSwitchModal {...set} />}
		</div>
	);
}
