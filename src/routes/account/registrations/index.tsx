import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { Radio } from "@/components/base/radio-group";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { Cart } from "@/components/registrations/cart";
import {
	registrationPageSchema,
	useCartProfiles,
} from "@/components/registrations/context";
import { DivisionRegistrations } from "@/components/registrations/division-registrations";
import { RegistrationDivisions } from "@/components/registrations/registration-divisions";
import type { PlayerProfile } from "@/db/schema";
import { DefaultLayout } from "@/layouts/default";
import { isDefined } from "@/utils/types";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { uniq, without } from "lodash-es";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import {
	DialogTrigger,
	isTextDropItem,
	ListBox,
	ListBoxItem,
	useDragAndDrop,
} from "react-aria-components";
import z from "zod";

export const Route = createFileRoute("/account/registrations/")({
	validateSearch: registrationPageSchema,
	beforeLoad: ({ search: { profiles, memberships } }) => {
		const extras = without(memberships, ...profiles);

		if (extras.length > 0) {
			throw redirect({
				to: "/account/registrations",
				search: {
					profiles: profiles.concat(extras),
					memberships,
				},
			});
		}

		const deduped = uniq(profiles);

		if (deduped.length !== profiles.length) {
			throw redirect({
				to: "/account/registrations",
				search: {
					profiles: deduped,
					memberships,
				},
			});
		}
	},
	component: RouteComponent,
	scripts: () => [
		{
			src: `${import.meta.env.VITE_USAEPAY_BASE_URL}/js/v2/pay.js`,
		},
	],
});

function RouteComponent() {
	const { memberships } = Route.useSearch();
	const navigate = useNavigate();

	const profiles = useCartProfiles();

	const membershipProfiles = memberships
		.map((id) => profiles.find((profile) => profile.id === id))
		.filter(isDefined);

	const addToMemberships = (profileId: number) => {
		if (!memberships.includes(profileId)) {
			navigate({
				to: "/account/registrations",
				replace: true,
				search: (search) => ({
					...search,
					memberships: [...memberships, profileId],
				}),
			});
		}
	};

	const removeFromMemberships = (profileId: number) => {
		navigate({
			to: "/account/registrations",
			replace: true,
			search: (search) => ({
				...search,
				memberships: without(memberships, profileId),
			}),
		});
	};

	return (
		<DefaultLayout
			classNames={{
				content: "flex flex-col py-8 space-y-6",
			}}
		>
			<div className="text-center py-8">
				<h1 className={title()}>Registration</h1>
			</div>

			<div className="grid grid-cols-6 gap-x-3 px-3 max-w-6xl w-full mx-auto flex-1">
				<div className="col-span-4 bg-white rounded-lg grid grid-cols-10">
					<div className="col-span-3 border-r border-gray-200">
						<div className="py-3 px-4 flex flex-row items-center justify-between">
							<span>Players</span>

							<AddPlayerForm />
						</div>
						<DraggableProfileList profiles={profiles} />
					</div>
					<div className="col-span-7">
						<div className="py-3 px-4 flex flex-col gap-y-3 border-b border-gray-200">
							<div className="flex flex-row items-center justify-between">
								<span>Memberships</span>

								<AddMembershipForm />
							</div>
							<DroppableMembershipsList
								profiles={membershipProfiles}
								onProfileDrop={addToMemberships}
								onProfileRemove={removeFromMemberships}
							/>
						</div>
						<div className="py-3 px-4 flex flex-col gap-y-3 border-b border-gray-200">
							<div className="flex flex-row items-center justify-between">
								<span>Tournaments</span>

								<Button color="primary" variant="text" size="xs">
									<PlusIcon size={12} /> Add Tournament
								</Button>
							</div>

							<RegistrationDivisions />
						</div>
					</div>
				</div>

				<Cart />
			</div>
		</DefaultLayout>
	);
}

function DraggableProfileList({
	profiles,
}: {
	profiles: (PlayerProfile & { registrations: number })[];
}) {
	const { dragAndDropHooks } = useDragAndDrop({
		getItems(keys) {
			return [...keys].map((key) => {
				const item = profiles.find((p) => p.id === key);
				return {
					"text/plain": `${item?.preferredName || item?.firstName} ${item?.lastName}`,
					profile: JSON.stringify(item),
				};
			});
		},
		getAllowedDropOperations: () => ["copy"],
	});

	return (
		<ListBox
			aria-label="Players"
			items={profiles}
			dragAndDropHooks={dragAndDropHooks}
			selectionMode="single"
		>
			{(profile) => (
				<ListBoxItem
					key={profile.id}
					id={profile.id}
					textValue={`${profile.preferredName || profile.firstName} ${profile.lastName}`}
					className="p-2 flex flex-row items-center justify-between border-b border-gray-200 cursor-grab active:cursor-grabbing"
				>
					<div className="flex flex-row gap-x-2 items-center">
						<GripVerticalIcon className="text-gray-400" size={16} />
						<ProfilePhoto {...profile} />
						<ProfileName {...profile} />
					</div>
					{profile.registrations > 0 && (
						<span className="text-gray-400">({profile.registrations})</span>
					)}
				</ListBoxItem>
			)}
		</ListBox>
	);
}

function DroppableMembershipsList({
	profiles,
	onProfileDrop,
	onProfileRemove,
}: {
	profiles: (PlayerProfile & { registrations: number })[];
	onProfileDrop: (profileId: number) => void;
	onProfileRemove: (profileId: number) => void;
}) {
	const { memberships } = Route.useSearch();

	const [isDragOver, setIsDragOver] = useState(false);

	const { dragAndDropHooks } = useDragAndDrop({
		acceptedDragTypes: ["profile"],
		getDropOperation: () => "copy",
		onDropEnter: () => setIsDragOver(true),
		onDropExit: () => setIsDragOver(false),
		async onRootDrop(e) {
			setIsDragOver(false);
			const items = await Promise.all(
				e.items.filter(isTextDropItem).map(async (item) => {
					const text = await item.getText("profile");
					return JSON.parse(text) as PlayerProfile;
				}),
			);
			for (const item of items) {
				onProfileDrop(item.id);
			}
		},
	});

	return (
		<ListBox
			aria-label="Memberships"
			items={profiles}
			dragAndDropHooks={dragAndDropHooks}
			selectionMode="single"
			dependencies={[memberships]}
			renderEmptyState={() => (
				<div
					className={`p-4 border-2 border-dashed rounded-md text-sm text-center transition-colors ${
						isDragOver
							? "border-blue-500 bg-blue-50 text-blue-600"
							: "border-gray-300 bg-gray-50 text-gray-600"
					}`}
				>
					{isDragOver
						? "Drop to add membership"
						: "Drag players here to add memberships..."}
				</div>
			)}
		>
			{(profile) => (
				<ListBoxItem
					key={profile.id}
					id={profile.id}
					textValue={`${profile.preferredName || profile.firstName} ${profile.lastName}`}
					className="p-2 flex flex-row items-center justify-between bg-gray-100 border border-gray-300 rounded-md mb-2 last-of-type:mb-0"
				>
					<div className="flex flex-row gap-x-2 items-center">
						<ProfilePhoto {...profile} />
						<ProfileName {...profile} />
					</div>
					<Button
						variant="text"
						size="xs"
						tooltip="Remove membership"
						onPress={() => onProfileRemove(profile.id)}
					>
						<Trash2Icon size={16} />
					</Button>
				</ListBoxItem>
			)}
		</ListBox>
	);
}

function AddPlayerForm() {
	const [open, setOpen] = useState(false);

	const navigate = useNavigate();

	const form = useAppForm({
		defaultValues: {
			profileId: null as number | null,
		},
		onSubmit: ({ value: { profileId }, formApi }) => {
			if (profileId) {
				navigate({
					replace: true,
					to: "/account/registrations",
					search: (search) => ({
						...search,
						profiles: uniq((search.profiles ?? []).concat(profileId)),
					}),
				});
			}

			setOpen(false);
			formApi.reset();
		},
	});

	return (
		<DialogTrigger isOpen={open} onOpenChange={setOpen}>
			<Button color="primary" variant="text" size="xs">
				<PlusIcon size={12} /> Add
			</Button>
			<Modal>
				<div className="p-3 flex flex-col space-y-3">
					<h2 className={title({ size: "sm" })}>Select Player</h2>

					<form
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						<form.AppField name="profileId">
							{(field) => (
								<field.ProfilePicker
									label="Player"
									field={field}
									selectedProfileIds={
										field.state.value ? [field.state.value] : []
									}
								/>
							)}
						</form.AppField>
						<form.AppForm>
							<form.Footer>
								<Button slot="close">Cancel</Button>

								<form.SubmitButton>Add</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}

function AddMembershipForm() {
	const { memberships } = Route.useSearch();

	const profiles = useCartProfiles();

	const availableProfiles = profiles.filter(
		({ id, activeMembership }) =>
			activeMembership === null && !memberships.includes(id),
	);

	const [open, setOpen] = useState(false);

	const navigate = useNavigate();

	const form = useAppForm({
		defaultValues: {
			profileIds: [] as number[],
		},
		validators: {
			onChange: z.object({
				profileIds: z.array(z.number()),
			}),
		},
		onSubmit: ({ value: { profileIds }, formApi }) => {
			if (profileIds.length) {
				navigate({
					replace: true,
					to: "/account/registrations",
					search: (search) => ({
						...search,
						memberships: uniq((search.memberships ?? []).concat(profileIds)),
					}),
				});
			}

			setOpen(false);

			formApi.reset();
		},
	});

	return (
		<DialogTrigger isOpen={open} onOpenChange={setOpen}>
			<Button color="primary" variant="text" size="xs">
				<PlusIcon size={12} /> Add Membership
			</Button>
			<Modal>
				<div className="p-3 flex flex-col space-y-3">
					<h2 className={title({ size: "xs" })}>Add Membership</h2>

					<p>Choose a player to add.</p>

					<form
						className="flex flex-col gap-y-3"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						<form.AppField name="profileIds">
							{(field) => (
								<field.RadioGroup mode="int" field={field}>
									{availableProfiles.map((profile) => (
										<Radio key={profile.id} value={profile.id.toString()}>
											<ProfilePhoto {...profile} />
											<ProfileName {...profile} link={false} />
										</Radio>
									))}
								</field.RadioGroup>
							)}
						</form.AppField>
						<div className="flex flex-row items-center space-x-3">
							<hr className="flex-1 border-gray-300" />
							<span className="text-gray-500 text-lg">OR</span>
							<hr className="flex-1 border-gray-300" />
						</div>
						<form.AppField name="profileIds" mode="array">
							{(field) => (
								<field.ProfilePicker
									label="Search"
									field={field}
									selectedProfileIds={field.state.value}
								/>
							)}
						</form.AppField>
						<form.AppForm>
							<form.Footer>
								<Button slot="close">Cancel</Button>

								<form.SubmitButton>Add</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
