import { useSuspenseQuery } from "@tanstack/react-query"
import { tournamentQueryOptions } from "@/data/tournaments"
import type { Division, Level, TournamentDivision } from "@/db/schema"

export function getLevelDisplay(level: Level | null) {
  return (level?.abbreviated || level?.name)?.toUpperCase() || "N"
}

export function getTournamentDivisionDisplay({
  name,
  teamSize,
  gender,
  displayGender,
  displayDivision,
  division: { maxAge, name: divisionName, display: divisionDisplay },
}: Pick<TournamentDivision, "name" | "teamSize" | "gender"> & {
  displayGender?: boolean | null
  displayDivision?: boolean | null
  division: Pick<Division, "maxAge" | "name" | "display">
}) {
  let display = `${name ?? ""}`

  if (!name || displayGender) {
    if (display.length) {
      display += " "
    }

    if (gender === "coed") {
      display += "Coed"
    } else {
      display += maxAge
        ? gender === "male"
          ? "Boy's"
          : "Girl's"
        : gender === "male"
          ? "Men's"
          : "Women's"
    }
  }

  if (!name || displayDivision) {
    display += ` ${divisionDisplay ?? divisionName.toUpperCase()}`
  }

  if (teamSize === 4) {
    display += " 4's"
  } else if (teamSize === 6) {
    display += " 6's"
  }

  return display
}

export function useTournamentDivision(
  tournamentId: number,
  tournamentDivisionId: number
) {
  return useSuspenseQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) =>
      data?.tournamentDivisions.find(({ id }) => id === tournamentDivisionId),
  })
}

export function useTournamentDivisionName(
  tournamentId: number,
  tournamentDivisionId: number
) {
  const { data: division } = useTournamentDivision(
    tournamentId,
    tournamentDivisionId
  )

  if (!division) {
    return null
  }

  return getTournamentDivisionDisplay(division)
}
