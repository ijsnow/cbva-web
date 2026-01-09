import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal, ModalHeading } from "@/components/base/modal"
import { Popover } from "@/components/base/popover"
import {
  useLastSeed,
  usePoolsQueryOptions,
  useTeam,
  useTeamsQueryOptions,
} from "@/components/tournaments/context"
import {
  editSeedMutationOptions,
  editSeedSchema,
} from "@/functions/teams/edit-seed"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EditIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Dialog } from "react-aria-components"
import { TeamNames } from "../names"

export type EditSeedFormProps = {
  tournamentDivisionTeamId: number
  seed: number
  target: "division" | "pool"
}

export function EditSeedForm({
  tournamentDivisionTeamId,
  seed,
  target,
}: EditSeedFormProps) {
  const [isOpen, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const teamsQueryOptions = useTeamsQueryOptions()
  const poolsQueryOptions = usePoolsQueryOptions()

  const lastSeed = useLastSeed()

  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...editSeedMutationOptions(),
    onSuccess: () => {
      setOpen(false)

      if (target === "division") {
        queryClient.invalidateQueries(teamsQueryOptions)
      } else {
        queryClient.invalidateQueries(poolsQueryOptions)
      }
    },
  })

  const schema = editSeedSchema.omit({ id: true, target: true })

  const form = useAppForm({
    defaultValues: {
      seed,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { seed } }) => {
      mutate({
        id: tournamentDivisionTeamId,
        seed,
        target,
      })
    },
  })

  return (
    <>
      <Button
        variant="icon"
        size="sm"
        ref={triggerRef}
        onPress={() => setOpen(true)}
      >
        <EditIcon />
      </Button>
      <Popover triggerRef={triggerRef} isOpen={isOpen} onOpenChange={setOpen}>
        <Dialog aria-label="Set team and waitlist capacity">
          <form
            className="p-3 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault()

              form.handleSubmit()
            }}
          >
            {failureReason && (
              <form.AppForm>
                <form.Alert
                  title={"Unable to update seed"}
                  description={failureReason.message}
                />
              </form.AppForm>
            )}

            <form.AppField name="seed">
              {(field) => (
                <field.Number
                  field={field}
                  name="seed"
                  label="Desired Seed"
                  minValue={1}
                  maxValue={lastSeed}
                />
              )}
            </form.AppField>

            <form.AppForm>
              <form.Footer>
                <form.SubmitButton>Save</form.SubmitButton>
              </form.Footer>
            </form.AppForm>
          </form>
        </Dialog>
      </Popover>
    </>
  )
}

export type EditSeedFormModalProps = {
  tournamentDivisionTeamId: number
  seed: number
  target: "division" | "pool"
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSeedFormModal({
  tournamentDivisionTeamId,
  target,
  seed,
  ...props
}: EditSeedFormModalProps) {
  const team = useTeam(tournamentDivisionTeamId)

  const teamsQueryOptions = useTeamsQueryOptions()
  const poolsQueryOptions = usePoolsQueryOptions()

  const lastSeed = useLastSeed()

  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...editSeedMutationOptions(),
    onSuccess: () => {
      props.onOpenChange(false)

      if (target === "division") {
        queryClient.invalidateQueries(teamsQueryOptions)
      } else {
        queryClient.invalidateQueries(poolsQueryOptions)
      }
    },
  })

  const schema = editSeedSchema.omit({ id: true, target: true })

  const form = useAppForm({
    defaultValues: {
      seed,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { seed } }) => {
      mutate({
        id: tournamentDivisionTeamId,
        seed,
        target,
      })
    },
  })

  return (
    <Modal {...props}>
      <div className="p-3 flex flex-col space-y-8 relative">
        <ModalHeading>Edit Seed</ModalHeading>

        <p>
          Edit {target} seed for{" "}
          <TeamNames
            className="font-semibold italic"
            players={team?.team.players || []}
            link={false}
          />
          .
        </p>

        <form
          className="p-3 flex flex-col"
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          {failureReason && (
            <form.AppForm>
              <form.Alert
                title={"Unable to update seed"}
                description={failureReason.message}
              />
            </form.AppForm>
          )}

          <form.AppField name="seed">
            {(field) => (
              <field.Number
                field={field}
                name="seed"
                label="Desired Seed"
                minValue={1}
                maxValue={lastSeed}
              />
            )}
          </form.AppField>

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => props.onOpenChange(false)}>Cancel</Button>
              <form.SubmitButton>Save</form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
