import { expect, test } from "vitest"
import { bytesToScore } from "./utils"

const testCases: [string, [number, number]][] = [
  ["k+A/umGA", [19, 21]],
  ["FjRQqyA", [21, 13]],
  ["/gf8", [6, 15]],
  ["1MkqCEA", [21, 12]],
  ["LKURCQ", [21, 10]],
  ["VoBV8No", [21, 17]],
  ["aW6ZLg", [14, 16]],
  ["uBKIVIA", [21, 11]],
  ["NUrIOhA", [21, 14]],
  ["tqoZyiaA", [21, 19]],
  ["S1aKsg", [16, 14]],
  ["Af/AAIA", [21, 11]],
  ["oWJiGUA", [21, 12]],
  ["B///Bw", [10, 21]],
  ["1EU1aA", [15, 13]],
  ["FJhMtEA", [21, 12]],
]

for (const [input, [a, b]] of testCases) {
  test(`decoding "${input}" results in (${a}, ${b})`, () => {
    expect(bytesToScore(input)).toStrictEqual([a, b])
  })
}
