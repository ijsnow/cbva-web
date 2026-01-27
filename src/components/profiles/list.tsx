import { Link } from "@tanstack/react-router";
import { CheckIcon, EditIcon, UserCircleIcon } from "lucide-react";
import type { Membership, PlayerProfile } from "@/db/schema";
import { button } from "../base/button";
import { ProfileName } from "./name";
import { tagStyles } from "../base/tag-group";

export type ProfileListProps = {
	className?: string;
	profiles: (Pick<
		PlayerProfile,
		"id" | "firstName" | "preferredName" | "lastName" | "imageSource"
	> & { activeMembership: Pick<Membership, "id"> | null })[];
	linkNames?: boolean;
};

export function ProfileList({
	className,
	profiles,
	linkNames = true,
}: ProfileListProps) {
	console.log(profiles);

	return (
		<ul className={className}>
			{profiles.map(
				({
					id,
					firstName,
					preferredName,
					lastName,
					imageSource = undefined,
					activeMembership,
				}) => (
					<li
						key={id}
						className="py-2 flex flex-row gap-x-3 items-center justify-between"
					>
						<span className="flex-1 flex flex-row gap-x-2">
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
								className="ml-2 flex-1"
								id={id}
								firstName={firstName}
								preferredName={preferredName}
								lastName={lastName}
								link={linkNames}
							/>
						</span>

						<div className="flex flex-row gap-x-4 items-center">
							{activeMembership ? (
								<span className={tagStyles({ color: "green" })}>
									<CheckIcon size={12} /> Active
								</span>
							) : (
								<Link
									className={tagStyles({ color: "red" })}
									to="/account/registrations"
									search={{
										memberships: [{ profileId: id, tshirtSize: undefined }],
									}}
								>
									Inactive
								</Link>
							)}

							<Link
								to="/profile/$profileId/edit"
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
						</div>
					</li>
				),
			)}
		</ul>
	);
}
