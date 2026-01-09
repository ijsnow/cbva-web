import { useQuery } from "@tanstack/react-query"
import { playoffMatchQueryOptions, poolMatchQueryOptions } from "@/data/matches"

export function isSetDone(
  teamAScore: number,
  teamBScore: number,
  winScore: number
) {
  return (
    (teamAScore >= winScore && teamAScore - teamBScore >= 2) ||
    (teamBScore >= winScore && teamBScore - teamAScore >= 2)
  )
}

export function useMatchTeams(id: number, kind: "pool" | "playoff") {
  const { data: poolMatch } = useQuery({
    ...poolMatchQueryOptions(id),
    enabled: kind === "pool",
  })

  const { data: playoffMatch } = useQuery({
    ...playoffMatchQueryOptions(id),
    enabled: kind === "playoff",
  })

  const match = kind === "pool" ? poolMatch : playoffMatch

  if (!match) {
    return undefined
  }

  return {
    teamA: match.teamA,
    teamB: match.teamB,
  }
}

export function useMatchSets(id: number, kind: "pool" | "playoff") {
  const { data: poolMatch } = useQuery({
    ...poolMatchQueryOptions(id),
    enabled: kind === "pool",
  })

  const { data: playoffMatch } = useQuery({
    ...playoffMatchQueryOptions(id),
    enabled: kind === "playoff",
  })

  return kind === "pool" ? poolMatch?.sets : playoffMatch?.sets
}
