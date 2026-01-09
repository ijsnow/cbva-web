import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import clsx from "clsx"
import { Group } from "react-aria-components"
import { useViewerHasPermission } from "@/auth/shared"
import { Separator } from "@/components/base/separator"
import { Toolbar } from "@/components/base/toolbar"
import { tournamentQueryOptions } from "@/data/tournaments"
import { AddTeamForm } from "./add-team"
import { SetCapacityForm } from "./set-capacity"
import { Button } from "@/components/base/button"
import { CheckIcon, EditIcon } from "lucide-react"

export function TeamsControlsToolbar({
  className,
  onEditPress,
  onDonePress,
}: {
  className?: string
  onEditPress?: () => void
  onDonePress?: () => void
}) {
  const canUpdate = useViewerHasPermission({
    tournament: ["update"],
  })

  const { tournamentId: tournamentIdStr, divisionId: divisionIdStr } =
    useParams({
      from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
    })

  const tournamentId = Number.parseInt(tournamentIdStr, 10)
  const divisionId = Number.parseInt(divisionIdStr, 10)

  const { data: division } = useQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) => {
      return data?.tournamentDivisions.find(({ id }) => id === divisionId)
    },
  })

  if (!canUpdate || !division) {
    return null
  }

  return (
    <Toolbar
      aria-label="Text formatting"
      className={clsx("flex gap-4 w-fit", className)}
    >
      <Group className="flex gap-2">
        <SetCapacityForm tournamentId={tournamentId} division={division} />
      </Group>

      <Separator orientation="vertical" className="self-stretch bg-gray-700" />

      <Group aria-label="Clipboard" className="flex gap-2">
        {onEditPress && (
          <Button variant="icon" onPress={onEditPress}>
            <EditIcon size={12} />
          </Button>
        )}
        {onDonePress && (
          <Button variant="icon" onPress={onDonePress}>
            <CheckIcon size={12} />
          </Button>
        )}
        <AddTeamForm tournamentId={tournamentId} division={division} />
      </Group>
    </Toolbar>
  )
}
