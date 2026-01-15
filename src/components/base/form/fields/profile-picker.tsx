import { ProfilePhoto } from "@/components/profiles/photo";
import type { FieldProps } from "./shared";
import { ProfileName } from "@/components/profiles/name";
import { Button } from "../../button";
import { useRef } from "react";
import { XIcon } from "lucide-react";
import type { PlayerProfile } from "@/db/schema";
import {
	searchProfilesQueryOptions,
	searchProfilesSchema,
} from "@/data/profiles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AsyncComboBoxField } from "./combo-box";
import { levelsQueryOptions } from "@/data/levels";
import { isDefined } from "@/utils/types";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";

export type ProfilePickerFieldProps = FieldProps & {
	isDisabled?: boolean;
	qualifiesDivision?: number;
	selectedProfileIds: number[];
};

export function ProfilePickerField({
	label,
	field,
	isDisabled,
	qualifiesDivision,
	selectedProfileIds,
}: ProfilePickerFieldProps) {
	const profiles = useRef<PlayerProfile[]>([]);

	const queryClient = useQueryClient();

	const { data: levelsForDivision } = useQuery({
		...levelsQueryOptions({ division: qualifiesDivision }),
		enabled: isDefined(qualifiesDivision),
		select: (data) => data.map(({ id }) => id),
	});

	const { data: selectedProfile } = useQuery({
		...getProfilesQueryOptions({ ids: selectedProfileIds }),
		enabled: selectedProfileIds.length > 0,
		select: (data) => data.find(({ id }) => id === field.state.value),
	});

	return selectedProfile ? (
		<div className="flex flex-row justify-between items-center">
			<span className="flex flex-row space-x-2">
				<ProfilePhoto {...selectedProfile} />
				<ProfileName {...selectedProfile} />
			</span>
			<Button
				className="text-red-500"
				variant="icon"
				onPress={() => {
					field.handleChange(null);
				}}
			>
				<XIcon size={16} />
			</Button>
		</div>
	) : (
		<AsyncComboBoxField
			className="flex-1"
			label={label}
			field={field}
			isDisabled={isDisabled}
			placeholder="Start typing a name..."
			onSelectionChange={(next) => {
				const profile = profiles.current?.find(({ id }) => id === next);

				field.handleChange(profile?.id ?? null);
			}}
			fetchOptions={{
				load: async ({ filterText }) => {
					const parse = searchProfilesSchema.safeParse({
						name: filterText,
						levels: levelsForDivision,
					});

					if (!parse.success) {
						return {
							items: [],
						};
					}

					const result = await queryClient.ensureQueryData(
						searchProfilesQueryOptions(parse.data),
					);

					profiles.current = result;

					return {
						items: result.map(
							({ id, preferredName, firstName, lastName, ...profile }) => ({
								beforeDisplay: (
									<ProfilePhoto
										preferredName={preferredName}
										firstName={firstName}
										lastName={lastName}
										{...profile}
									/>
								),
								display: `${preferredName || firstName} ${lastName}`,
								value: id,
							}),
						),
					};
				},
			}}
		/>
	);
}
