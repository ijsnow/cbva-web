import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { useViewerHasPermission } from "@/auth/shared"
import { title } from "@/components/base/primitives"
import { RichTextDisplay } from "@/components/base/rich-text-editor/display"
import {
  contentPageBlocksQueryOptions,
  updateContentBlockMutationOptions,
} from "@/data/blocks"
import type { LexicalState } from "@/db/schema/shared"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/sanctioning")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      contentPageBlocksQueryOptions("sanctioning")
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const canEdit = useViewerHasPermission({
    content: ["update"],
  })

  const { data: content } = useSuspenseQuery({
    ...contentPageBlocksQueryOptions("sanctioning"),
    select: (data) => data.find(({ key }) => key === "sanctioning")?.content,
  })

  const queryClient = useQueryClient()

  const { mutateAsync } = useMutation({
    ...updateContentBlockMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [],
      })
    },
  })

  return (
    <DefaultLayout
      classNames={{
        content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
      }}
    >
      <Suspense>
        <h1
          className={title({
            class: "w-full text-center ",
          })}
        >
          About Sanctioning
        </h1>

        {content && (
          <RichTextDisplay
            name="ratings"
            content={content}
            onSave={
              canEdit
                ? async (state) => {
                    await mutateAsync({
                      page: "sanctioning",
                      key: "sanctioning",
                      content: state as LexicalState,
                    })
                  }
                : undefined
            }
          />
        )}
      </Suspense>
    </DefaultLayout>
  )
}
