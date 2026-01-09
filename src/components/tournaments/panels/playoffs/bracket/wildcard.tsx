import { useSuspenseQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { EditIcon } from "lucide-react"
import { useState } from "react"
import { useViewerHasPermission } from "@/auth/shared"
import { Button } from "@/components/base/button"
import {
  AssignWildcardForm,
  type AssignWildcardFormProps,
} from "@/components/tournaments/controls/assign-wildcard"
import { tournamentQueryOptions } from "@/data/tournaments"

export type WildcardProps = {
  matchId: number
  a: boolean
} & Pick<AssignWildcardFormProps, "opponent">

export function Wildcard({ matchId, opponent, a }: WildcardProps) {
  const canEdit = useViewerHasPermission({
    tournament: ["update"],
  })

  const [isOpen, setIsOpen] = useState(false)

  const { tournamentId: tournamentIdStr, divisionId: divisionIdStr } =
    useParams({
      from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
    })

  const tournamentId = Number.parseInt(tournamentIdStr, 10)
  const divisionId = Number.parseInt(divisionIdStr, 10)

  const { data: division } = useSuspenseQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) =>
      data?.tournamentDivisions.find(({ id }) => id === divisionId),
  })

  return (
    <div className="flex flex-row space-x-4 items-center">
      <span>Wildcard</span>

      {canEdit && (
        <>
          <Button
            variant="icon"
            onPress={() => setIsOpen(true)}
            isDisabled={!division}
          >
            <EditIcon size={14} />
          </Button>

          {division && (
            <AssignWildcardForm
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              tournamentId={tournamentId}
              division={division}
              opponent={opponent}
              matchId={matchId}
            />
          )}
        </>
      )}
    </div>
  )
}
