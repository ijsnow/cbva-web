import { useLocalStorageState } from "ahooks"
import clsx from "clsx"
import { UndoIcon } from "lucide-react"
import { ToggleButton } from "react-aria-components"

import { Button } from "../base/button"
import { boxStyles } from "../base/checkbox"
import { ProfileName } from "../profiles/name"
import type { MatchTeam } from "../tournaments/panels/games/pool-match-grid"

export function ServeOrderTracker({
  setId,
  teamA,
  teamB,
}: {
  setId: number
  teamA: Omit<MatchTeam, "poolTeam">
  teamB: Omit<MatchTeam, "poolTeam">
}) {
  const defaultOrder = Array.from({
    length: teamA.team.players.length + teamB.team.players.length,
  }).map(() => null)

  const [order, setOrder] = useLocalStorageState<(number | null)[]>(
    `set/${setId}/serve-order`,
    {
      defaultValue: () => defaultOrder,
    }
  )

  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-semibold">
        <span className="mr-2">Serve Order</span>
        <Button
          size="xs"
          variant="outline"
          onPress={() => setOrder(defaultOrder)}
        >
          <UndoIcon size={8} />
          Reset
        </Button>
      </h4>
      <div className="flex flex-row gap-3">
        {[teamA, teamB].map((team) => (
          <div key={team.id} className="flex flex-col gap-2">
            {team.team.players.map(({ profile }) => {
              const position = order.indexOf(profile.id)
              const selected = position !== -1

              const complete = order.every((v) => v !== null)
              const lastChosen = [...order].reverse().find((v) => v !== null)
              const lastChosenInTeam = team.team.players.some(
                ({ profile }) => profile.id === lastChosen
              )

              const otherTeamIsNext = !complete && lastChosenInTeam

              return (
                <ToggleButton
                  key={profile.id}
                  className={clsx(
                    "flex flex-row gap-2",
                    selected
                      ? "border-gray-700"
                      : "disabled:cursor-not-allowed disabled:text-gray-600",
                    complete ? "cursor-default" : "cursor-pointer"
                  )}
                  isDisabled={otherTeamIsNext}
                  onChange={(selected) => {
                    if (selected) {
                      const slot = order.indexOf(null)

                      setOrder((state) => {
                        const next = [...(state || [])]
                        next[slot] = profile.id
                        return next
                      })
                    }
                  }}
                >
                  <span
                    className={boxStyles({
                      isDisabled: !selected && otherTeamIsNext,
                    })}
                  >
                    {position === -1 ? null : position + 1}
                  </span>
                  <ProfileName {...profile} />
                </ToggleButton>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
