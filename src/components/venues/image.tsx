import { EditIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { Venue } from "@/db/schema";
import { Button } from "../base/button";
import { UploadImage } from "../base/upload-image";

export type VenueImageProps = Pick<Venue, "id"> & {
	className?: string;
};

export function VenueImage({ id, className }: VenueImageProps) {
	return (
		<div className={twMerge("relative", className)}>
			<div className="h-full overflow-hidden">
				<img
					src="/homepage.jpg"
					alt="CBVA Home Page"
					className="w-full h-full object-cover"
					style={{ objectPosition: "50% 65%" }}
				/>
			</div>
			<UploadImage />
		</div>
	);
}
