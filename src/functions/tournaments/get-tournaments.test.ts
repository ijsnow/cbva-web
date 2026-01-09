import { describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { getTournamentsHandler } from "./get-tournaments"

describe("getTournaments", () => {
  test("does not return unpublished or demo tournaments", async () => {
    const visible = await bootstrapTournament(db, {
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

    await bootstrapTournament(db, {
      demo: true,
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

    await bootstrapTournament(db, {
      visible: false,
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

    const result = await getTournamentsHandler(
      {
        page: 1,
        pageSize: 25,
        venues: [],
        divisions: [],
        genders: [],
        past: true,
      },
      undefined
    )

    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe(visible.id)
  })
})
