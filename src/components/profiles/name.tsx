import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import type { PlayerProfile } from "@/db/schema";

export type ProfileNameProps = Pick<
	PlayerProfile,
	"id" | "preferredName" | "firstName" | "lastName"
> & {
	showFirst?: boolean;
};

export function ProfileName({
	id,
	preferredName,
	firstName,
	lastName,
	showFirst = true,
}: ProfileNameProps) {
	return (
		<Link
			to="/profile/$profileId"
			params={{ profileId: id.toString() }}
			className="hover:underline"
		>
			{showFirst ? `${preferredName ?? firstName} ` : null}

			<span className={clsx(showFirst && "hidden sm:inline-block")}>
				{lastName}
			</span>

			{showFirst && (
				<span className={clsx("sm:hidden")}>{lastName.slice(0, 1)}.</span>
			)}
		</Link>
	);
}
