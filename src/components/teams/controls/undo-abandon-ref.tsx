import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Heading } from "react-aria-components"
import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import {
  undoAbandonRefMutationOptions,
  undoAbandonRefSchema,
} from "@/functions/refs/undo-abandon-ref"
import { isDefined } from "@/utils/types"
import { checkAbandonedRefQueryOptions } from "@/functions/refs/check-abandoned-ref"

export type UndoAbandonRefFormProps = {
  tournamentDivisionTeamId: number
  refTeamId: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function UndoAbandonRefForm({
  tournamentDivisionTeamId,
  refTeamId,
  ...props
}: UndoAbandonRefFormProps) {
  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...undoAbandonRefMutationOptions(),
    onSuccess: () => {
      queryClient.setQueryData(
        checkAbandonedRefQueryOptions(tournamentDivisionTeamId).queryKey,
        () => null
      )

      props.onOpenChange(false)
    },
  })

  const schema = undoAbandonRefSchema.omit({ id: true })

  const form = useAppForm({
    defaultValues: {},
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: () => {
      mutate({
        id: refTeamId,
      })
    },
  })

  return (
    <Modal {...props}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <Heading className={title({ size: "sm" })} slot="title">
          Undo Abandon Ref?
        </Heading>

        <p className="text-sm text-gray-700 mb-2">
          Are you sure you want to undo marking this team as having abandoned
          ref duties?
        </p>

        <form
          className="flex flex-col space-y-6"
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          {failureReason && (
            <form.AppForm>
              <form.Alert
                title={"Unable to mark abandoned ref"}
                description={failureReason.message}
              />
            </form.AppForm>
          )}

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => props.onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton
                requireChange={false}
                isDisabled={!isDefined(refTeamId)}
              >
                Confirm
              </form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
