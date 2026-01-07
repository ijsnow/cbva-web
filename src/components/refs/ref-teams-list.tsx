import {
	MatchRefTeam,
	PlayerProfile,
	Team,
	TeamPlayer,
	TournamentDivisionTeam,
} from "@/db/schema";
import { TeamNames } from "../teams/names";
import { useViewerHasPermission } from "@/auth/shared";
import { AbandonRefForm } from "../teams/controls/abandon-ref";
import { EditMatchRefsForm } from "../tournaments/controls/edit-playoff-match-refs";
import { assert } from "@/utils/assert";

export type RefTeamsListProps = {
	tournamentDivisionId: number;
	matchStatus: string | "completed";
	refTeams: (MatchRefTeam & {
		team: Pick<TournamentDivisionTeam, "id"> & {
			team: Pick<Team, "id"> & {
				players: (TeamPlayer & {
					profile: Pick<
						PlayerProfile,
						"id" | "preferredName" | "firstName" | "lastName"
					>;
				})[];
			};
		};
	})[];
} & (
	| {
			poolMatchId: number;
			playoffMatchId?: never;
	  }
	| { playoffMatchId: number; poolMatchId?: never }
);

export function RefTeamsList({
	tournamentDivisionId,
	playoffMatchId,
	poolMatchId,
	matchStatus,
	refTeams,
}: RefTeamsListProps) {
	const canEdit = useViewerHasPermission({
		tournament: ["update"],
	});

	const matchId = poolMatchId ?? playoffMatchId;

	return (
		<>
			{refTeams.length ? (
				<>
					<div className="whitespace-nowrap text-ellipsis flex flex-row items-center gap-2">
						Refs:{" "}
						{refTeams.map((team) => (
							<span key={team.id} className="flex flex-row items-center gap-2">
								<TeamNames {...team.team.team} />

								{canEdit && <AbandonRefForm refTeamId={team.id} />}
							</span>
						))}
					</div>

					{canEdit && matchStatus !== "completed" && (
						<EditMatchRefsForm
							tournamentDivisionId={tournamentDivisionId}
							matchId={matchId}
						/>
					)}
				</>
			) : (
				<div>Self Ref</div>
			)}
		</>
	);
}
