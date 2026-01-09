import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Heading } from "react-aria-components"

import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import { poolsQueryOptions } from "@/data/pools"
import { teamsQueryOptions } from "@/data/teams"
import {
  completePoolsMutationOptions,
  completePoolsSchema,
} from "@/functions/pools"
import type { Division, TournamentDivision } from "@/db/schema"

export type CompletePoolsFormProps = {
  tournamentId: number
  division: TournamentDivision & { division: Division }
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CompletePoolsForm({
  tournamentId,
  division,
  onOpenChange,
  ...props
}: CompletePoolsFormProps) {
  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...completePoolsMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
          .queryKey,
      })

      queryClient.invalidateQueries({
        queryKey: poolsQueryOptions({ tournamentDivisionId: division.id })
          .queryKey,
      })

      onOpenChange(false)
    },
  })

  // const schema = completePoolsSchema;

  const form = useAppForm({
    defaultValues: {
      // overwrite: false,
    },
    validators: {
      // onMount: schema,
      // onChange: schema,
    },
    onSubmit: () => {
      mutate({
        id: division.id,
      })
    },
  })

  return (
    <Modal {...props} onOpenChange={onOpenChange}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <Heading className={title({ size: "sm" })} slot="title">
          Complete Pools
        </Heading>

        <p className="text-sm text-gray-700 mb-6">
          Calculate finish positions for all pools in this division based on
          match results. This will use the standard tie-breaking criteria:
        </p>

        <ul className="text-sm text-gray-700 mb-6 list-disc list-inside space-y-1">
          <li>Win-loss record</li>
          <li>Head-to-head results</li>
          <li>Point differential among tied teams</li>
          <li>Point differential among all teams</li>
        </ul>

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
                title="Unable to complete pools"
                description={failureReason.message}
              />
            </form.AppForm>
          )}

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton requireChange={false}>
                Complete Pools
              </form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
