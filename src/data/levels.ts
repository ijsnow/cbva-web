import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import z from "zod"

import { db } from "@/db/connection"

export const getLevelsSchema = z.object({
  division: z.number().optional(),
})

const getLevels = createServerFn({
  method: "GET",
})
  .inputValidator(getLevelsSchema)
  .handler(
    async ({ data: { division } }) =>
      await db.query.levels.findMany({
        where: division ? (t, { lte }) => lte(t.order, division) : undefined,
        orderBy: (t, { desc }) => desc(t.order),
      })
  )

export const levelsQueryOptions = (
  data: z.infer<typeof getLevelsSchema> = {}
) =>
  queryOptions({
    queryKey: ["levels"],
    queryFn: () => getLevels({ data }),
  })
