export const DIVISIONS = [
  { name: "unrated", display: "Unrated", abbreviated: "U" },
  { name: "b" },
  { name: "a" },
  { name: "aa" },
  { name: "aaa" },
  { name: "open", display: "Open" },
]

export function getQualifiedLevels(division: number) {
  return DIVISIONS.slice(0, division)
}

export function getDivisionDisplay(division: number) {
  if (division > DIVISIONS.length) {
    throw new Error(`invalid division; expected 0..${DIVISIONS.length - 1}`)
  }

  return DIVISIONS[division]
}
