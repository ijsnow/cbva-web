import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  blocks,
  type CreateBlock,
  createBlockSchema,
  selectPageSchema,
} from "@/db/schema"

export const getPageBlocks = createServerFn()
  .inputValidator(
    selectPageSchema.pick({
      path: true,
    })
  )
  .handler(async ({ data: { path } }) => {
    const block = await db._query.blocks.findMany({
      where: (t, { eq }) => eq(t.page, path),
    })
    return block ?? {}
  })

export const contentPageBlocksQueryOptions = (path: string) =>
  queryOptions({
    queryKey: ["page_blocks", path],
    queryFn: () => getPageBlocks({ data: { path } }),
  })

export const updatePageFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      content: ["update"],
    }),
  ])
  .inputValidator(createBlockSchema)
  .handler(async ({ data }) => {
    await db
      .insert(blocks)
      .values(data)
      .onConflictDoUpdate({
        target: blocks.key,
        set: {
          content: data.content,
        },
      })
  })

export const updateContentBlockMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateBlock) => updatePageFn({ data }),
  })
