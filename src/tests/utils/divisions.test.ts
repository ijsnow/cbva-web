import { describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { getQualifiedLevels } from "./divisions"

describe("getQualifiedLevels", () => {
  const cases = [
    {
      input: "a",
      want: ["unrated", "b", "a"],
    },
    {
      input: "b",
      want: ["unrated", "b"],
    },
    {
      input: "aaa",
      want: ["unrated", "b", "a", "aa", "aaa"],
    },
  ]

  for (const { input, want } of cases) {
    test(`${input} -> ${want.join()}`, async () => {
      const got = await getQualifiedLevels(db, input)

      expect(got.map(({ name }) => name)).toStrictEqual(want)
    })
  }
})
