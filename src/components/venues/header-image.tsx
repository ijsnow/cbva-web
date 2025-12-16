import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { updateVenueMutationOptions, venueQueryOptions } from "@/data/venues";
import type { Venue } from "@/db/schema";
import { Button } from "../base/button";
import { EditVenueImage } from "./edit-image";

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`;

export type VenueHeaderImageProps = Pick<
	Venue,
	"id" | "headerImageSource" | "name" | "city"
> & {
	className?: string;
};

export function VenueHeaderImage({
	id,
	headerImageSource,
	name,
	city,
	className,
}: VenueHeaderImageProps) {
	const queryClient = useQueryClient();

	const [updatedSource, setUpdatedSource] = useState<string | undefined>();

	const { mutate } = useMutation({
		...updateVenueMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(venueQueryOptions(id));

			setUpdatedSource(undefined);
		},
	});

	const src = `${STORAGE_URL}/venues/${updatedSource ?? headerImageSource}`;

	return (
		<div className={twMerge("relative", className)}>
			<div className="h-full overflow-hidden">
				<img
					src={src}
					alt={`${name}, ${city}`}
					className="w-full h-full object-cover"
				/>
			</div>

			{updatedSource ? (
				<div className="absolute top-3 right-3 flex flex-row space-x-2">
					<Button
						onPress={() => {
							setUpdatedSource(undefined);

							// TODO: delete object in bucket
						}}
					>
						Discard
					</Button>
					<Button
						color="primary"
						onPress={() => {
							mutate({ id, headerImageSource: updatedSource });
						}}
					>
						Save
					</Button>
				</div>
			) : (
				<EditVenueImage
					venueId={id}
					onUploadSuccess={(source) => {
						setUpdatedSource(source);
					}}
				/>
			)}
		</div>
	);
}
