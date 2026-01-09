export interface SnakeDraftOptions {
  teams: string[]
  rounds: number
  itemsPerTeam?: number
}

export interface DraftPick {
  round: number
  pick: number
  team: string
  overallPick: number
}

export interface SnakeDraftResult {
  picks: DraftPick[]
  draftOrder: string[][]
}

/**
 * Generates a snake draft order
 * In snake drafting, the draft order reverses each round
 * Example with 3 teams and 3 rounds:
 * Round 1: Team A, Team B, Team C
 * Round 2: Team C, Team B, Team A
 * Round 3: Team A, Team B, Team C
 */
export function generateSnakeDraft(
  options: SnakeDraftOptions
): SnakeDraftResult {
  const { teams, rounds, itemsPerTeam = 1 } = options
  const numTeams = teams.length
  const picks: DraftPick[] = []
  const draftOrder: string[][] = []

  let overallPick = 1

  for (let round = 1; round <= rounds; round++) {
    const roundOrder: string[] = []
    const isReversed = round % 2 === 0

    for (let pick = 1; pick <= numTeams; pick++) {
      const teamIndex = isReversed ? numTeams - pick : pick - 1
      const team = teams[teamIndex]

      roundOrder.push(team)

      for (let item = 1; item <= itemsPerTeam; item++) {
        picks.push({
          round,
          pick,
          team,
          overallPick,
        })
        overallPick++
      }
    }

    draftOrder.push(roundOrder)
  }

  return {
    picks,
    draftOrder,
  }
}

/**
 * Generates a snake draft with specific items to draft
 * Useful when you have a pool of items to be drafted
 */
export function generateSnakeDraftWithItems<T>(
  teams: string[],
  items: T[],
  rounds?: number
): { picks: DraftPick[]; assignments: Map<string, T[]> } {
  const numTeams = teams.length
  const totalItems = items.length

  if (!rounds) {
    rounds = Math.ceil(totalItems / numTeams)
  }

  const draftResult = generateSnakeDraft({
    teams,
    rounds,
    itemsPerTeam: 1,
  })

  const assignments = new Map<string, T[]>()
  teams.forEach((team) => assignments.set(team, []))

  draftResult.picks.slice(0, totalItems).forEach((pick, index) => {
    const teamPicks = assignments.get(pick.team)
    if (teamPicks && index < items.length) {
      teamPicks.push(items[index])
    }
  })

  return {
    picks: draftResult.picks.slice(0, totalItems),
    assignments,
  }
}
