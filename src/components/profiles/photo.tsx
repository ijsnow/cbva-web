import { CircleUserIcon } from "lucide-react"

import type { PlayerProfile } from "@/db/schema"

export function ProfilePhoto({
  imageSource,
  preferredName,
  firstName,
  lastName,
}: Pick<
  PlayerProfile,
  "imageSource" | "preferredName" | "firstName" | "lastName"
>) {
  if (!imageSource) {
    return <CircleUserIcon className="h-6 w-6" />
  }

  return (
    <img
      className="h-6 w-6 rounded-full overflow-hidden border border-gray-300"
      src={imageSource}
      alt={`${preferredName || firstName} ${lastName}`}
    />
  )
}
