import { useViewerHasPermission } from "@/auth/shared"
import { DropdownMenu, DropdownMenuItem } from "@/components/base/dropdown-menu"
import { MenuSection } from "@/components/base/menu"
import { SettingsIcon } from "lucide-react"
import { useState } from "react"
import { UndoAbandonRefForm } from "./undo-abandon-ref"
import { useQuery } from "@tanstack/react-query"
import { checkAbandonedRefQueryOptions } from "@/functions/refs/check-abandoned-ref"
import { isDefined } from "@/utils/types"
import type { PoolTeam, TournamentDivisionTeam } from "@/db/schema"
import { PromoteFromWaitlistForm } from "./promote-from-waitlist"
import { RemoveTeamForm } from "./remove-team"
import { EditSeedFormModal } from "./edit-seed"
import { EditPoolFormModal } from "./edit-pool"

enum ModalKind {
  Remove = 0,
  UndoAbandonedRef = 1,
  PromoteFromWaitlist = 2,
  EditSeed = 3,
  EditPool = 4,
}

export type TeamControlsDropdownProps = {
  tournamentDivisionTeamId: number
  poolTeam?: Pick<PoolTeam, "poolId">
} & Pick<TournamentDivisionTeam, "seed" | "status">

export function TeamControlsDropdown({
  tournamentDivisionTeamId,
  status,
  seed,
  poolTeam,
}: TeamControlsDropdownProps) {
  const canUpdate = useViewerHasPermission({
    tournament: ["update"],
  })

  const [activeModal, setActiveModal] = useState<ModalKind>()

  const { data: abandonedRefTeamId } = useQuery(
    checkAbandonedRefQueryOptions(tournamentDivisionTeamId)
  )

  if (!canUpdate) {
    return null
  }

  const makeModalOpenProps = (kind: ModalKind) => ({
    tournamentDivisionTeamId,
    isOpen: activeModal === kind,
    onOpenChange: (open: boolean) => {
      const next = open ? kind : undefined

      console.log("hello", next)

      setActiveModal(next)
    },
  })

  const hasSeed = isDefined(seed)
  const hasPool = isDefined(poolTeam)

  return (
    <>
      <DropdownMenu buttonIcon={<SettingsIcon />}>
        <MenuSection title="Team Controls">
          {status === "waitlisted" ? (
            <DropdownMenuItem
              onPress={() => setActiveModal(ModalKind.PromoteFromWaitlist)}
            >
              Promote
            </DropdownMenuItem>
          ) : (
            <>
              {hasSeed && (
                <DropdownMenuItem
                  onPress={() => setActiveModal(ModalKind.EditSeed)}
                >
                  Edit Seed
                </DropdownMenuItem>
              )}
              {hasPool && (
                <DropdownMenuItem
                  onPress={() => setActiveModal(ModalKind.EditPool)}
                >
                  Edit Pool
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onPress={() => setActiveModal(ModalKind.Remove)}
              >
                Remove Team
              </DropdownMenuItem>
              <DropdownMenuItem
                isDisabled={!isDefined(abandonedRefTeamId)}
                onPress={() => setActiveModal(ModalKind.UndoAbandonedRef)}
              >
                Undo Abandoned Ref
              </DropdownMenuItem>
            </>
          )}
        </MenuSection>
      </DropdownMenu>

      {status === "waitlisted" && (
        <PromoteFromWaitlistForm
          {...makeModalOpenProps(ModalKind.PromoteFromWaitlist)}
          tournamentDivisionTeamId={tournamentDivisionTeamId}
        />
      )}

      {abandonedRefTeamId && (
        <UndoAbandonRefForm
          {...makeModalOpenProps(ModalKind.UndoAbandonedRef)}
          refTeamId={abandonedRefTeamId}
        />
      )}

      <RemoveTeamForm
        {...makeModalOpenProps(ModalKind.Remove)}
        tournamentDivisionTeamId={tournamentDivisionTeamId}
      />

      {hasSeed && (
        <EditSeedFormModal
          {...makeModalOpenProps(ModalKind.EditSeed)}
          tournamentDivisionTeamId={tournamentDivisionTeamId}
          target="division"
          seed={seed}
        />
      )}

      {hasPool && (
        <EditPoolFormModal
          {...makeModalOpenProps(ModalKind.EditPool)}
          tournamentDivisionTeamId={tournamentDivisionTeamId}
          poolId={poolTeam.poolId}
        />
      )}
    </>
  )
}
