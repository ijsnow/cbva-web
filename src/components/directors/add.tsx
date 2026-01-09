import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { EditIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { DialogTrigger, Heading } from "react-aria-components"
import z from "zod"
import {
  directorsQueryOptions,
  insertTournamentDirectorMutationOptions,
  insertVenueDirectorMutationOptions,
} from "@/data/directors"
import { tournamentQueryOptions } from "@/data/tournaments"
import { venueQueryOptions } from "@/data/venues"
import { dbg } from "@/utils/dbg"
import { Button, type ButtonProps } from "../base/button"
import { useAppForm } from "../base/form"
import { Modal } from "../base/modal"
import { title } from "../base/primitives"

export type DirectorsModalProps = {
  triggerProps?: ButtonProps
  targetId: number
  mode: "venue" | "tournament"
  existingDirectorIds: number[]
}

const schema = z.object({
  directorId: z.number(),
})

export function AddDirector({
  triggerProps = {
    variant: "icon",
    color: "alternate",
    radius: "full",
    className: "text-blue-500",
    children: <EditIcon size={16} />,
  },
  targetId,
  mode,
  existingDirectorIds,
}: DirectorsModalProps) {
  const queryClient = useQueryClient()

  const [isOpen, setOpen] = useState(false)

  const { mutate: insertTournamentDirector, failureReason: tdFailureReason } =
    useMutation({
      ...insertTournamentDirectorMutationOptions(),
      onSuccess: () => {
        queryClient.invalidateQueries(tournamentQueryOptions(targetId))
      },
    })

  const { mutate: insertVenueDirector, failureReason: vFailureReason } =
    useMutation({
      ...insertVenueDirectorMutationOptions(),
      onSuccess: () => {
        queryClient.invalidateQueries(venueQueryOptions(targetId))
      },
    })

  const { data: options } = useQuery({
    ...directorsQueryOptions(),
    select: (data) =>
      data.map((d) => ({
        value: d.id,
        display: `${d.profile.preferredName} ${d.profile.lastName}`,
        additionalText: "ope",
      })),
  })

  const form = useAppForm({
    defaultValues: {
      directorId: null as unknown as number,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value, formApi }) => {
      const onSuccess = () => {
        setOpen(false)

        formApi.reset()
      }

      if (mode === "tournament") {
        insertTournamentDirector(
          dbg({
            tournamentId: targetId,
            directorId: value.directorId,
          }),
          {
            onSuccess,
          }
        )
      } else {
        insertVenueDirector(
          {
            venueId: targetId,
            directorId: value.directorId,
          },
          {
            onSuccess,
          }
        )
      }
    },
  })

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button {...triggerProps} />

      <Modal isDismissable isOpen={isOpen} onOpenChange={setOpen}>
        <div className="p-3 flex flex-col space-y-4 relative">
          <Heading
            className={title({
              size: "sm",
              class: "flex flex-row justify-between items-center",
            })}
            slot="title"
          >
            <span>Add Director</span>

            <Button variant="icon" slot="close">
              <XIcon size={16} />
            </Button>
          </Heading>

          <form
            onSubmit={(e) => {
              e.preventDefault()

              form.handleSubmit()
            }}
          >
            {(tdFailureReason || vFailureReason) && (
              <form.AppForm>
                <form.Alert
                  title="Uh oh!"
                  description={(tdFailureReason || vFailureReason)?.message}
                />
              </form.AppForm>
            )}

            <form.AppField
              name="directorId"
              children={(field) => (
                <field.ComboBox
                  isRequired
                  className="col-span-full"
                  label="Director to Add"
                  field={field}
                  options={
                    options?.filter(
                      (v) => !existingDirectorIds.includes(v.value)
                    ) || []
                  }
                  autoFocus={true}
                  disabledKeys={existingDirectorIds}
                />
              )}
            />

            <form.AppForm>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <form.Footer className="justify-stretch">
                    <form.SubmitButton
                      className="w-full"
                      isDisabled={!canSubmit || isSubmitting}
                    >
                      Submit
                    </form.SubmitButton>
                  </form.Footer>
                )}
              />
            </form.AppForm>
          </form>
        </div>
      </Modal>
    </DialogTrigger>
  )
}
