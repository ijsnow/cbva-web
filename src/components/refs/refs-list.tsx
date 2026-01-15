import { useViewerHasPermission } from "@/auth/shared";
import type {
	MatchRef,
	MatchRefTeam,
	PlayerProfile,
	Team,
	TeamPlayer,
	TournamentDivisionTeam,
} from "@/db/schema";
import { AbandonRefForm } from "../teams/controls/abandon-ref";
import { RemoveRefForm } from "../teams/controls/remove-ref";
import { TeamNames } from "../teams/names";
import { EditMatchRefsForm } from "../tournaments/controls/edit-playoff-match-refs";
import { ProfileName } from "../profiles/name";
import { groupBy } from "lodash-es";
import { SetMatchRefsForm } from "./set-match-refs";

// TODO: match ref teams -> match refs
// - change this (or new) file to modify refs. if refs have same teamId, operate on them equally
// - add any arbitrary profile to ref
//
// Operations to change:
// - abandon ref      should take id or teamId
// - undo abandon ref "

export type RefsListProps = {
	tournamentDivisionId: number;
	matchStatus: string | "completed" | "tbd";
	refs: (MatchRef & {
		profile: Pick<
			PlayerProfile,
			"id" | "preferredName" | "firstName" | "lastName"
		>;
	})[];
	// refTeams: (MatchRefTeam & {
	// 	team: Pick<TournamentDivisionTeam, "id"> & {
	// 		team: Pick<Team, "id"> & {
	// 			players: (TeamPlayer & {
	// 				profile: Pick<
	// 					PlayerProfile,
	// 					"id" | "preferredName" | "firstName" | "lastName"
	// 				>;
	// 			})[];
	// 		};
	// 	};
	// })[];
} & (
	| {
			poolMatchId: number;
			playoffMatchId?: never;
	  }
	| { playoffMatchId: number; poolMatchId?: never }
);

export function RefsList({
	tournamentDivisionId,
	playoffMatchId,
	poolMatchId,
	matchStatus,
	refs,
}: RefsListProps) {
	const canEdit = useViewerHasPermission({
		tournament: ["update"],
	});

	const groupedRefs = groupBy(refs, "teamId");

	return (
		<>
			{refs.length ? (
				<div className="whitespace-nowrap text-ellipsis flex flex-row items-center gap-2">
					Refs:{" "}
					{Object.keys(groupedRefs)
						.map((teamId) => ({
							teamId: teamId === "null" ? null : Number.parseInt(teamId, 10),
							refs: groupedRefs[teamId],
						}))
						.map(({ teamId, refs }) => (
							<span key={teamId} className="flex flex-row items-center gap-2">
								<TeamNames players={refs} />

								{canEdit && matchStatus !== "completed" && (
									<>
										<RemoveRefForm
											ids={refs.map(({ id }) => id)}
											teamId={teamId}
										/>

										{teamId && <AbandonRefForm teamId={teamId} />}
									</>
								)}
							</span>
						))}
				</div>
			) : matchStatus === "tbd" ? null : (
				<div>Self Ref</div>
			)}

			{canEdit && !["completed", "tbd"].includes(matchStatus) && (
				<SetMatchRefsForm
					tournamentDivisionId={tournamentDivisionId}
					playoffMatchId={playoffMatchId}
					poolMatchId={poolMatchId}
				/>
			)}
		</>
	);
}
