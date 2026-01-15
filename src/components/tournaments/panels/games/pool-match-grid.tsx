import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { CircleDot, EditIcon } from "lucide-react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/base/button";
import { ProfileName } from "@/components/profiles/name";
import type {
	MatchRef,
	MatchRefTeam,
	MatchSet,
	PlayerProfile,
	Pool,
	PoolMatch,
	PoolTeam,
	Team,
	TeamPlayer,
	TournamentDivisionTeam,
} from "@/db/schema";
import { isDefined, isNotNull } from "@/utils/types";
import { RefTeamsList } from "@/components/refs/ref-teams-list";
import { useActiveDivisionId, useIsDemoTournament } from "../../context";
import { RefsList } from "@/components/refs/refs-list";
import { SimulateMatchModal } from "../../controls/simulate-match";
import { useViewerHasPermission } from "@/auth/shared";
import { OverrideScoreForm } from "@/components/matches/director-controls/override-score";
import { useState } from "react";

export const scoreTextStyles = tv({
	base: "p-3 text-center flex flex-col justify-center col-span-2 md:col-span-1 text-xl font-light border-gray-300",
	variants: {
		winner: {
			true: "",
			false: "",
		},
		inProgress: {
			true: "font-bold",
		},
		last: {
			true: ["border-r-0"],
			false: ["border-r"],
		},
	},
	compoundVariants: [
		{
			winner: false,
			inProgress: false,
			class: "text-gray-400",
		},
	],
});

export type MatchTeam = Pick<
	TournamentDivisionTeam,
	"id" | "playoffsSeed" | "wildcard"
> & {
	team: Pick<Team, "id"> & {
		players: {
			profile: Pick<
				PlayerProfile,
				"id" | "preferredName" | "firstName" | "lastName"
			>;
		}[];
	};
	poolTeam: Pick<PoolTeam, "seed" | "finish"> & { pool: Pick<Pool, "name"> };
};

export function PoolMatchGrid({
	id,
	status,
	sets,
	matchNumber,
	teamA,
	teamB,
	refs,
	refetch,
}: Pick<PoolMatch, "id" | "winnerId" | "matchNumber" | "status"> & {
	sets: Pick<
		MatchSet,
		| "id"
		| "teamAScore"
		| "teamBScore"
		| "winnerId"
		| "startedAt"
		| "endedAt"
		| "setNumber"
		| "status"
	>[];
	teamA: MatchTeam | null;
	teamB: MatchTeam | null;
	refs: (MatchRef & {
		profile: Pick<
			PlayerProfile,
			"id" | "preferredName" | "firstName" | "lastName"
		>;
	})[];
	refetch: () => void;
}) {
	const tournamentDivisionId = useActiveDivisionId();
	const isDemo = useIsDemoTournament();
	const canUpdate = useViewerHasPermission({
		tournament: ["update"],
	});
	const [overrideId, setOverrideId] = useState<number | undefined>(undefined);

	return (
		<div className="rounded-md overflow-hidden w-full border border-gray-300">
			<div className="grid grid-cols-10 items-center bg-navbar-background text-navbar-foreground">
				<div
					className={clsx(
						"p-3 flex flex-row items-center space-x-3",
						sets.length > 1
							? "col-span-4 md:col-span-7"
							: "col-span-8 md:col-span-9",
					)}
				>
					<Link
						to="/matches/pool/$matchId"
						className="hover:underline"
						params={{ matchId: id.toString() }}
					>
						{sets.length > 1 ? "Match" : "Game"} {matchNumber}
					</Link>

					{sets.some(({ status }) => status === "in_progress") ? (
						<Button
							size="sm"
							className="rounded-sm px-2"
							color="primary"
							tooltip={<>Click to refresh</>}
							onClick={refetch}
						>
							<CircleDot size={18} />
							Live
						</Button>
					) : null}

					<RefsList
						tournamentDivisionId={tournamentDivisionId}
						poolMatchId={id}
						matchStatus={isDefined(teamA) && isDefined(teamB) ? status : "tbd"}
						refs={refs}
					/>

					{canUpdate && isDemo && teamA && teamB && status !== "completed" && (
						<SimulateMatchModal
							tournamentDivisionId={tournamentDivisionId}
							matchId={id}
							matchKind="pool"
						/>
					)}
				</div>
				{sets.map((s) => (
					<div
						key={s.id}
						className="p-3 text-center col-span-2 md:col-span-1 whitespace-nowrap"
					>
						{canUpdate ? (
							<Button
								variant={canUpdate ? "link" : "text"}
								color="alternate"
								className="text-inherit p-0"
								onPress={
									canUpdate
										? () => {
												setOverrideId(s.id);
											}
										: undefined
								}
								tooltip={canUpdate ? "Click to override score" : undefined}
							>
								{sets.length > 1 ? <>Set {s.setNumber}</> : "Score"}
							</Button>
						) : (
							<span>{sets.length > 1 ? <>Set {s.setNumber}</> : "Score"}</span>
						)}
						<OverrideScoreForm
							matchId={id}
							matchKind="pool"
							setId={s.id}
							isOpen={overrideId === s.id}
							onOpenChange={(open) => {
								if (open) {
									setOverrideId(s.id);
								} else {
									setOverrideId(undefined);
								}
							}}
						/>
					</div>
				))}
			</div>
			{[teamA, teamB].filter(isNotNull).map((team) => (
				<div
					key={team.id}
					className="grid grid-cols-10 items-stretch border-b border-gray-300 bg-white last-of-type:border-b-0"
				>
					<div
						className={clsx(
							"p-4 flex flex-row space-x-2 items-center",
							sets.length > 1
								? "col-span-4 md:col-span-7"
								: "col-span-8 md:col-span-9",
						)}
					>
						<span
							className="p-2 bg-gray-200 rounded-xs"
							title={`Seed ${team.poolTeam?.seed ?? "?"}`}
						>
							#{team.poolTeam?.seed ?? "?"}
						</span>
						<div className={clsx("flex flex-col")}>
							{team?.team.players.map(({ profile }) => (
								<ProfileName {...profile} key={profile.id} />
							))}
						</div>
					</div>
					{sets
						.sort((a, b) => a.setNumber - b.setNumber)
						.map((s, i) => (
							<div
								key={s.id}
								className={scoreTextStyles({
									winner:
										s.status === "completed"
											? (s.teamAScore > s.teamBScore &&
													teamA?.id === team.id) ||
												(s.teamAScore < s.teamBScore && teamA?.id !== team.id)
											: undefined,
									// s.winnerId === null ? undefined : s.winnerId === team.id,
									inProgress: Boolean(s.startedAt) && !s.endedAt,
									last: i === sets.length - 1,
								})}
							>
								{s.status !== "not_started"
									? teamA?.id === team.id
										? s.teamAScore
										: s.teamBScore
									: "-"}
							</div>
						))}
				</div>
			))}
		</div>
	);
}
