import { describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { editSeed } from "./edit-seed"
import { orderBy } from "lodash-es"

describe("division seeds", () => {
  test("move a team up in seeds", async () => {
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 5,
          pools: 1,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const teams = await db._query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
      orderBy: (t, { asc }) => asc(t.seed),
    })

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    expect(teams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [second.id, 2],
      [third.id, 3],
      [fourth.id, 4],
      [fifth.id, 5],
    ])

    await editSeed({
      data: {
        id: fourth.id,
        seed: 2,
        target: "division",
      },
    })

    const updatedTeams = await db._query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
      orderBy: (t, { asc }) => [asc(t.seed)],
    })

    expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [fourth.id, 2],
      [second.id, 3],
      [third.id, 4],
      [fifth.id, 5],
    ])
  })

  test("move a team down in seeds", async () => {
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 5,
          pools: 1,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const teams = await db._query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
      orderBy: (t, { asc }) => [asc(t.seed)],
    })

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    await editSeed({
      data: {
        id: second.id,
        seed: 4,
        target: "division",
      },
    })

    const updatedTeams = await db._query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
      orderBy: (t, { asc }) => [asc(t.seed)],
    })

    expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [third.id, 2],
      [fourth.id, 3],
      [second.id, 4],
      [fifth.id, 5],
    ])
  })
})

describe("pool seeds", () => {
  test("move a team up in seeds", async () => {
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 5,
          pools: 1,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const teams = orderBy(
      await db._query.tournamentDivisionTeams.findMany({
        with: {
          poolTeam: true,
        },
        where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
        orderBy: (t, { asc }) => [asc(t.seed)],
      }),
      [(t) => t.poolTeam.seed],
      ["asc"]
    )

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    expect(teams.map(({ id, poolTeam: { seed } }) => [id, seed])).toStrictEqual(
      [
        [first.id, 1],
        [second.id, 2],
        [third.id, 3],
        [fourth.id, 4],
        [fifth.id, 5],
      ]
    )

    await editSeed({
      data: {
        id: fourth.id,
        seed: 2,
        target: "pool",
      },
    })

    const updatedTeams = orderBy(
      await db._query.tournamentDivisionTeams.findMany({
        with: {
          poolTeam: true,
        },
        where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
        orderBy: (t, { asc }) => [asc(t.seed)],
      }),
      [(t) => t.poolTeam.seed],
      ["asc"]
    )

    expect(
      updatedTeams.map(({ id, poolTeam: { seed } }) => [id, seed])
    ).toStrictEqual([
      [first.id, 1],
      [fourth.id, 2],
      [second.id, 3],
      [third.id, 4],
      [fifth.id, 5],
    ])
  })

  test("move a team down in seeds", async () => {
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 5,
          pools: 1,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const teams = orderBy(
      await db._query.tournamentDivisionTeams.findMany({
        with: {
          poolTeam: true,
        },
        where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
        orderBy: (t, { asc }) => [asc(t.seed)],
      }),
      [(t) => t.poolTeam.seed],
      ["asc"]
    )

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    await editSeed({
      data: {
        id: second.id,
        seed: 4,
        target: "pool",
      },
    })

    const updatedTeams = orderBy(
      await db._query.tournamentDivisionTeams.findMany({
        with: {
          poolTeam: true,
        },
        where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
        orderBy: (t, { asc }) => [asc(t.seed)],
      }),
      [(t) => t.poolTeam.seed],
      ["asc"]
    )

    expect(
      updatedTeams.map(({ id, poolTeam: { seed } }) => [id, seed])
    ).toStrictEqual([
      [first.id, 1],
      [third.id, 2],
      [fourth.id, 3],
      [second.id, 4],
      [fifth.id, 5],
    ])
  })
})
