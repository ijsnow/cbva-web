import { twMerge } from "tailwind-merge";
import type { Venue } from "@/db/schema";
import { EditVenueImage } from "./edit-image";

export type VenueImageProps = Pick<
	Venue,
	"id" | "imageSource" | "name" | "city"
> & {
	className?: string;
};

export function VenueImage({
	imageSource,
	name,
	city,
	className,
}: VenueImageProps) {
	return (
		<div className={twMerge("relative", className)}>
			<div className="h-full overflow-hidden">
				<img
					src={
						"https://inhtyrgzfnhfkgeizoec.supabase.co/storage/v1/object/public/venues/background.png"
					}
					alt={`${name}, ${city}`}
					className="w-full h-full object-cover"
					style={{ objectPosition: "50% 65%" }}
				/>
			</div>

			<EditVenueImage imageSource={imageSource} />
		</div>
	);
}
