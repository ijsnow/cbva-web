import type { PlayerProfile } from "@/db/schema";
import { ProfileName } from "../profiles/name";

export function TeamNames({
	players,
}: {
	players: {
		profile: Pick<
			PlayerProfile,
			"id" | "preferredName" | "firstName" | "lastName"
		>;
	}[];
}) {
	return (
		<span>
			{players.map(({ profile }, i) => (
				<span key={profile.id}>
					<ProfileName {...profile} /> {i !== players.length - 1 && " & "}
				</span>
			))}
		</span>
	);
}
