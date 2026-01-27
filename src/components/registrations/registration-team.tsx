import { PlayerProfile } from "@/db/schema";
import { uniqueId } from "lodash-es";
import { tv } from "tailwind-variants";

const teamStyles = tv({
	base: "p-3 bg-gray-50 border border-gray-300 rounded-md flex flex-row items-center gap-x-4",
});

export function RegistrationTeam({
	name,
	profileIds,
	teamSize,
}: {
	name: string;
	profileIds: PlayerProfile["id"][];
	teamSize: number;
}) {
	return (
		<div className={teamStyles()}>
			<span>{name}</span>
			<div className="flex flex-row gap-x-2">
				{Array.from({ length: teamSize - profileIds.length }).map((_, i) => (
					<div
						key={uniqueId()}
						className="p-2 border border-gray-300 rounded-sm"
					>
						Add player
					</div>
				))}
			</div>
		</div>
	);
}
