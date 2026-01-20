import clsx from "clsx";
import { CircleUserIcon } from "lucide-react";
import type { PlayerProfile } from "@/db/schema";

export function ProfilePhoto({
	className = "h-6 w-6",
	imageSource,
	preferredName,
	firstName,
	lastName,
}: Pick<
	PlayerProfile,
	"imageSource" | "preferredName" | "firstName" | "lastName"
> & { className?: string }) {
	if (!imageSource) {
		return <CircleUserIcon className={className} />;
	}

	return (
		<img
			className={clsx(
				"rounded-full overflow-hidden border border-gray-300",
				className,
			)}
			src={imageSource}
			alt={`${preferredName || firstName} ${lastName}`}
		/>
	);
}
