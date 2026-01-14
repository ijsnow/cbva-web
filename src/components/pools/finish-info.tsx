import { CircleQuestionMarkIcon } from "lucide-react";
import { Button } from "../base/button";
import { Modal } from "../base/modal";
import { DialogTrigger, Heading } from "react-aria-components";
import { title } from "../base/primitives";
import { usePoolStats } from "../tournaments/context";
import { TeamNames } from "../teams/names";
import { twMerge } from "tailwind-merge";

export type PoolInfoFinishProps = {
	poolId: number;
	activeTeamId: number;
};

export function PoolFinishInfo({ poolId, activeTeamId }: PoolInfoFinishProps) {
	const stats = usePoolStats(poolId);

	return (
		<DialogTrigger>
			<Button variant="text" size="xs">
				<CircleQuestionMarkIcon size={12} />
			</Button>
			<Modal isDismissable>
				<div className="p-4 flex flex-col space-y-4 relative">
					<Heading
						className={title({
							size: "sm",
							class: "flex flex-row justify-between items-center",
						})}
						slot="title"
					>
						<span>Pool Results Breakdown</span>
					</Heading>

					<ul className="text-sm text-gray-700 mb-6 flex flex-col space-y-1 list-decimal list-inside">
						{[
							["W/L", "Win-loss record"],
							["H2H", "Head-to-head wins among tied teams"],
							["TDiff", "Point differential among tied teams"],
							["Diff", "Point differential among all teams"],
						].map(([key, label]) => (
							<li className="" key={key}>
								<span className="col-span-1">{key}:</span>{" "}
								<span className="col-span-8">{label}</span>
							</li>
						))}
					</ul>

					<div className="flex flex-col space-y-2 max-h-96 overflow-y-scroll">
						<div className="grid grid-cols-9 gap-x-2 items-center w-full mb-2">
							<span className="col-start-2 col-span-4">Team</span>
							<span className="col-span-1 text-center">W/L</span>
							<span className="col-span-1 text-center">H2H</span>
							<span className="col-span-1 text-center">TDiff</span>
							<span className="col-span-1 text-center">Diff</span>
						</div>
						{stats?.map((team, i) => (
							<div
								key={team.id}
								className={twMerge(
									"grid grid-cols-9 gap-x-2 items-center w-full rounded-md bg-white border-gray-300",
									team.id === activeTeamId
										? "font-semibold text-black"
										: "text-black",
								)}
							>
								<span className="col-span-1">
									{team.poolTeam.finish ?? i + 1}
								</span>
								<span className="col-span-4 text-ellipsis overflow-x-hidden whitespace-nowrap">
									<TeamNames
										players={team.team.players}
										showFirst={false}
										separator="/"
										link={false}
									/>
								</span>
								<span className="col-span-1 text-center">
									{team.stats?.wins.size}/{team.stats?.losses.size}
								</span>
								<span className="col-span-1 text-center">
									{team.stats?.headToHead}
								</span>
								<span className="col-span-1 text-center">
									{team.stats?.tiePointDiff}
								</span>
								<span className="col-span-1 text-center">
									{team.stats?.totalPointDiff}
								</span>
							</div>
						))}
					</div>
					<Button className="self-end" slot="close" color="primary">
						Close
					</Button>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
