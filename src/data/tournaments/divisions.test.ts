import { describe, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"

describe("Generating playoffs", () => {
  test("creates playoffs with even numbers", async () => {
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 30,
          pools: 6,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    // ...
  })
})
