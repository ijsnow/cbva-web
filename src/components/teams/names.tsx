import type { PlayerProfile } from "@/db/schema";
import { ProfileName, type ProfileNameProps } from "../profiles/name";

export function TeamNames({
	players,
	orientation = "col",
	separator = " & ",
	...props
}: {
	players: {
		profile: Pick<
			PlayerProfile,
			"id" | "preferredName" | "firstName" | "lastName"
		>;
	}[];
	orientation?: "row" | "col";
	separator?: "/" | " & ";
} & Pick<ProfileNameProps, "showFirst">) {
	return (
		<span>
			{players.map(({ profile }, i) => (
				<span key={profile.id}>
					<ProfileName {...profile} {...props} />
					{i !== players.length - 1 && separator}
				</span>
			))}
		</span>
	);
}
