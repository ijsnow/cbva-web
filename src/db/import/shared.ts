export function mapLevel(div: string) {
  switch (div) {
    case "Novice":
      return null
    default:
      return div.toLowerCase()
  }
}

export function mapDivision(div: string) {
  switch (div) {
    case "U12":
      return "12u"
    case "U14":
      return "14u"
    case "U16":
      return "16u"
    case "U18":
      return "18u"
    default:
      return div.toLowerCase()
  }
}

export function mapGender(gender: string): "male" | "female" | null {
  switch (gender.toLowerCase()) {
    case "male":
    case "men":
    case "mens":
      return "male"
    case "female":
    case "women":
    case "womens":
      return "female"
    case "coed":
    case "mixed":
    case "open":
    default:
      return null // For coed/mixed divisions, gender is null
  }
}
