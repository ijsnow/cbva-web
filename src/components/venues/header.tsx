import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useViewerHasPermission } from "@/auth/shared";
import { updateVenueMutationOptions, venueQueryOptions } from "@/data/venues";
import type { Venue } from "@/db/schema";
import { EditableImage } from "../base/editable-image";

export type VenueHeaderProps = Pick<
	Venue,
	"id" | "name" | "city" | "headerImageSource"
>;

export function VenueHeader({
	id,
	name,
	city,
	headerImageSource,
}: VenueHeaderProps) {
	const canUpdate = useViewerHasPermission({
		venues: ["update"],
	});

	const queryOptions = venueQueryOptions(id);

	const queryClient = useQueryClient();

	const { mutate: updateVenue } = useMutation({
		...updateVenueMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(queryOptions);
		},
	});

	return (
		<EditableImage
			editable={canUpdate}
			className="h-[25svh] w-full object-cover"
			alt={`${name}, ${city}`}
			source={headerImageSource ?? ""}
			bucket="venues"
			prefix={`${id}/headers`}
			onUploadSuccess={(source) => {
				queryClient.setQueriesData(queryOptions, (data) => {
					return {
						...data,
						headerImageSource: source,
					};
				});
			}}
			onDiscard={(original) => {
				queryClient.setQueriesData(queryOptions, (data) => {
					return {
						...data,
						headerImageSource: original,
					};
				});
			}}
			onSave={(source) => {
				updateVenue({
					id,
					headerImageSource: source,
				});
			}}
		/>
	);
}
