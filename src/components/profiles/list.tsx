import { Link } from "@tanstack/react-router";
import { EditIcon, UserCircleIcon } from "lucide-react";
import type { PlayerProfile } from "@/db/schema";
import { button } from "../base/button";
import { ProfileName } from "./name";

export type ProfileListProps = {
	className?: string;
	profiles: Pick<
		PlayerProfile,
		"id" | "firstName" | "preferredName" | "lastName" | "imageSource"
	>[];
	linkNames?: boolean;
};

export function ProfileList({
	className,
	profiles,
	linkNames = true,
}: ProfileListProps) {
	return (
		<ul className={className}>
			{profiles.map(
				({
					id,
					firstName,
					preferredName,
					lastName,
					imageSource = undefined,
				}) => (
					<li
						key={id}
						className="py-2 flex flex-row gap-x-3 items-center justify-between"
					>
						<span className="flex-1 grid grid-cols-10 gap-x-2">
							{imageSource ? (
								<img
									className="h-6 w-6 rounded-full overflow-hidden border border-gray-300"
									src={imageSource}
									alt={`${preferredName || firstName}`}
								/>
							) : (
								<UserCircleIcon className="h-6 w-6" />
							)}

							<ProfileName
								className="col-start-2 col-span-full"
								id={id}
								firstName={firstName}
								preferredName={preferredName}
								lastName={lastName}
								link={linkNames}
							/>
						</span>

						<Link
							to="/profile/$profileId"
							params={{
								profileId: id.toString(),
							}}
							className={button({
								variant: "text",
								size: "xs",
								className: "col-span-2",
							})}
						>
							<EditIcon size={18} />
							Edit
						</Link>
					</li>
				),
			)}
		</ul>
	);
}
