import type { PlayerProfile } from "@/db/schema"

export function playerNames(players: PlayerProfile[]): string[] {
  return players.map(playerName)
}

export function playerName({
  preferredName,
  firstName,
  lastName,
}: PlayerProfile): string {
  return `${preferredName || firstName} ${lastName}`
}
