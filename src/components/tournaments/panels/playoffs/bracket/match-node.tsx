import { Handle, Position } from "@xyflow/react";
import clsx from "clsx";
import { CircleDot } from "lucide-react";
import { tv } from "tailwind-variants";

import { Button } from "@/components/base/button";
import type { MatchSet, PlayoffMatch } from "@/db/schema";
import { isNotNull } from "@/utils/types";
import type { MatchTeam } from "../../games/pool-match-grid";
import { useActiveTeam, useSetActiveTeam } from ".";

export const scoreTextStyles = tv({
	base: "p-3 text-center flex flex-col justify-center col-span-1 text-xl font-light border-gray-300",
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

export function MatchNode({
	data,
}: {
	data: PlayoffMatch & {
		sets: MatchSet[];
		teamA: MatchTeam;
		teamB: MatchTeam;
		refetch: () => void;
	};
	type: string;
}) {
	const { teamA, teamB, court, sets, winnerId, matchNumber, refetch } = data;

	const activeTeam = useActiveTeam();
	const setActiveTeam = useSetActiveTeam();

	return (
		<div className="rounded-md overflow-hidden w-md border bg-white border-gray-300">
			<div className="grid grid-cols-6 items-center border-b border-gray-300">
				<div
					className={clsx(
						"p-3 flex flex-row items-center space-x-3",
						sets.length > 1 ? "col-span-3" : "col-span-5",
					)}
				>
					{court ? (
						<span>Court {court}</span>
					) : (
						<span>
							{sets.length > 1 ? "Match" : "Game"} {matchNumber}
						</span>
					)}
					{winnerId === null ? (
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
					<span>{data.id}</span>
				</div>
				{sets.map((s) => (
					<div key={s.id} className="p-3 text-center col-span-1">
						{sets.length > 1 ? <>Set {s.setNumber}</> : "Score"}
					</div>
				))}
			</div>
			{[teamA, teamB]
				.map((team, i) =>
					team
						? team
						: {
								id: `${data.id}-wildcard-${i}`,
								wildcard: true,
							},
				)
				.filter(isNotNull)
				.map((team, i) => (
					<div
						key={team.id}
						className={clsx(
							"grid grid-cols-6 items-stretch border-b border-gray-300 last-of-type:border-b-0",
							team.id === activeTeam ? "bg-gray-200" : "bg-white",
						)}
						role="none"
						tabIndex={-1}
						onMouseEnter={() => {
							setActiveTeam(team.id);
						}}
						onMouseLeave={() => {
							setActiveTeam(null);
						}}
					>
						<Handle
							type="target"
							position={Position.Left}
							id={team.id.toString()}
							style={{
								opacity: 0,
								position: "absolute",
								top: i === 0 ? "45%" : "78%",
								right: 0,
							}}
						/>
						<div
							className={clsx(
								"p-4 flex flex-row space-x-2 items-center",
								sets.length > 1 ? "col-span-3" : "col-span-5",
							)}
						>
							{team.poolTeam && (
								<span
									className="p-2 bg-gray-200 rounded-xs"
									title={`Seed ${team.poolTeam?.seed ?? "?"}`}
								>
									#{team.poolTeam?.seed ?? "?"}
								</span>
							)}
							<div
								className={clsx(
									"flex flex-col",
									winnerId && winnerId === team.id && "font-bold",
									winnerId && winnerId !== team.id && "text-gray-600",
								)}
							>
								{team?.team?.players.map(({ profile }) => (
									<span key={profile.id}>
										{profile.preferredName} {profile.lastName}
									</span>
								)) ?? "Wildcard"}
							</div>
						</div>
						{sets
							.sort((a, b) => a.setNumber - b.setNumber)
							.map((s, i) => (
								<div
									key={s.id}
									className={scoreTextStyles({
										winner:
											s.winnerId === null ? undefined : s.winnerId === team.id,
										inProgress: Boolean(s.startedAt) && !s.endedAt,
										last: i === sets.length - 1,
									})}
								>
									{s.startedAt
										? teamA?.id === team.id
											? s.teamAScore
											: s.teamBScore
										: "-"}
								</div>
							))}
						<Handle
							type="source"
							position={Position.Right}
							id={team.id.toString()}
							style={{
								opacity: 0,
								position: "absolute",
								top: i === 0 ? "45%" : "78%",
								right: 0,
							}}
						/>
					</div>
				))}
		</div>
	);
}
