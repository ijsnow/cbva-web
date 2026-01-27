import type { Gender, PlayerProfile } from "@/db/schema";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone, isTextDropItem } from "react-aria-components";
import { tv } from "tailwind-variants";
import { useCartProfiles, useDraggedProfile } from "./context";
import { DraggableProfile } from "./draggable-profile";
import { without } from "lodash-es";

const teamStyles = tv({
	base: "p-3 bg-gray-50 border border-gray-300 rounded-md flex flex-row items-center gap-x-4 transition-colors",
	variants: {
		dragState: {
			none: "",
			valid: "border-blue-500 bg-blue-50",
			invalid: "border-red-400 bg-red-50",
		},
	},
	defaultVariants: {
		dragState: "none",
	},
});

const slotStyles = tv({
	base: "p-2 border border-gray-200 bg-gray-200 rounded-sm text-sm",
	variants: {
		dragState: {
			none: "",
			valid: "border-blue-500 bg-blue-100 text-blue-600",
			invalid: "border-red-400 bg-red-100 text-red-600",
		},
	},
	defaultVariants: {
		dragState: "none",
	},
});

type DragState = "none" | "valid" | "invalid";

function isProfileValidForDivision(
	profile: PlayerProfile,
	divisionGender: Gender,
	currentProfileIds: number[],
): { valid: boolean; reason?: string } {
	// Check if profile is already on this team
	if (currentProfileIds.includes(profile.id)) {
		return { valid: false, reason: "Already on this team" };
	}

	// Check gender compatibility
	if (divisionGender === "coed") {
		return { valid: true };
	}

	if (profile.gender !== divisionGender) {
		return {
			valid: false,
			// reason: 'Wrong divisions',
		};
	}

	return { valid: true };
}

export function RegistrationTeam({
	id,
	name,
	profileIds,
	teamSize,
	gender,
}: {
	id: string;
	name: string;
	profileIds: PlayerProfile["id"][];
	teamSize: number;
	gender: Gender;
}) {
	const [dragState, setDragState] = useState<DragState>("none");
	const [invalidReason, setInvalidReason] = useState<string>();

	const emptySlots = teamSize - profileIds.length;

	const navigate = useNavigate();

	const cartProfiles = useCartProfiles();
	const draggedProfile = useDraggedProfile();

	const teamProfiles = cartProfiles?.filter(({ id }) =>
		profileIds.includes(id),
	);

	const addProfileToTeam = (profile: PlayerProfile) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: search.teams.map((team) =>
					team.id === id
						? { ...team, profileIds: team.profileIds.concat(profile.id) }
						: team,
				),
			}),
		});
	};

	const removeFromTeam = (profileId: number) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				teams: search.teams
					?.map((t) =>
						t.id === id
							? { ...t, profileIds: without(t.profileIds, profileId) }
							: t,
					)
					.filter((d) => d.profileIds.length > 0),
			}),
		});
	};

	return (
		<DropZone
			className={teamStyles({ dragState })}
			getDropOperation={(types) =>
				types.has("profile") && emptySlots > 0 ? "copy" : "cancel"
			}
			onDropEnter={() => {
				if (draggedProfile) {
					const { valid, reason } = isProfileValidForDivision(
						draggedProfile,
						gender,
						profileIds,
					);
					if (valid) {
						setDragState("valid");
						setInvalidReason(undefined);
					} else {
						setDragState("invalid");
						setInvalidReason(reason);
					}
				} else {
					setDragState("valid");
				}
			}}
			onDropExit={() => {
				setDragState("none");
				setInvalidReason(undefined);
			}}
			onDrop={async (e) => {
				const items = await Promise.all(
					e.items.filter(isTextDropItem).map(async (item) => {
						const text = await item.getText("profile");
						return JSON.parse(text) as PlayerProfile;
					}),
				);

				for (const profile of items) {
					const { valid } = isProfileValidForDivision(
						profile,
						gender,
						profileIds,
					);
					if (valid) {
						addProfileToTeam(profile);
					}
				}

				setDragState("none");
				setInvalidReason(undefined);
			}}
		>
			<span>{name}</span>

			<div className="flex flex-row items-center gap-x-2">
				{teamProfiles.map((profile) => (
					<DraggableProfile
						key={profile.id}
						{...profile}
						className={slotStyles()}
						onRemove={() => removeFromTeam(profile.id)}
					/>
				))}

				{emptySlots > 0 && (
					<div className={slotStyles({ dragState })}>
						{dragState === "invalid" && invalidReason
							? invalidReason
							: `Add ${emptySlots} more player(s)`}
					</div>
				)}
			</div>
		</DropZone>
	);
}
