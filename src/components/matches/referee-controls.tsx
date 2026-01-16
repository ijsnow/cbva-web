import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useViewer } from "@/auth/shared";
import {
	startMatchMutationOptions,
	undoSetCompletedMutationOptions,
} from "@/functions/matches";
import type { MatchSet } from "@/db/schema";
import { Button } from "../base/button";
import { title } from "../base/primitives";
import { ServeOrderTracker } from "./serve-order-tracker";
import { SideSwitchModal } from "./side-switch";
import type { SharedMatchData } from "@/functions/matches/get-match";

export function RefereeControls({
	match,
	set,
	queryKey,
}: {
	match: SharedMatchData;
	set: MatchSet;
	queryKey: QueryKey;
}) {
	const viewer = useViewer();

	const isRef = match.refs.map(({ profile }) => profile.userId === viewer?.id);

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

	if (!isRef) {
		return null;
	}

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

			{set.status === "in_progress" && match.teamA && match.teamB && (
				<ServeOrderTracker
					setId={set.id}
					teamA={match.teamA}
					teamB={match.teamB}
				/>
			)}
		</div>
	);
}
