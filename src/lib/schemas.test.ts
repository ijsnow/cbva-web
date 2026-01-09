import { CalendarDate } from "@internationalized/date"
import { describe, expect, test } from "vitest"
import { calendarDateSchema } from "./schemas"

describe("calendarDateSchema", () => {
  test("string passes", () => {
    const input = "2025-01-01"
    const got = calendarDateSchema().parse(input)

    expect(got).toMatchObject({
      year: 2025,
      month: 1,
      day: 1,
    })
  })

  test("string fails", () => {
    const input = "2025-04-31"
    const result = calendarDateSchema().safeParse(input)

    expect(result.success).toBe(false)
  })

  test("object passes", () => {
    const input = new CalendarDate(2025, 1, 1)
    const got = calendarDateSchema().parse(input)

    expect(got).toMatchObject({
      year: 2025,
      month: 1,
      day: 1,
    })
  })

  test("object fails", () => {
    const result = calendarDateSchema().safeParse({
      year: 2025,
      month: 4,
      day: 31,
    })

    expect(result.success).toBe(false)
  })
})
