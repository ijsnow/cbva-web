import { type CalendarDate, today } from "@internationalized/date"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Heading } from "react-aria-components"
import z from "zod"

import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import {
  duplicateTournamentOptions,
  duplicateTournamentSchema,
} from "@/data/schedule"
import { getDefaultTimeZone } from "@/lib/dates"
import { calendarDateSchema } from "@/lib/schemas"

export type DuplicateFormProps = {
  tournamentId: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DuplicateForm({
  tournamentId,
  onOpenChange,
  onSuccess,
  ...props
}: DuplicateFormProps) {
  const navigate = useNavigate()

  const { mutate } = useMutation({
    ...duplicateTournamentOptions(),
    onSuccess: ({ data }) => {
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      } else {
        navigate({
          to: "/tournaments/$tournamentId",
          params: {
            tournamentId: data.id.toString(),
          },
        })
      }
    },
  })

  const schema = duplicateTournamentSchema
    .pick({
      demo: true,
    })
    .extend({
      date: calendarDateSchema(),
    })

  const form = useAppForm({
    defaultValues: {
      date: today(getDefaultTimeZone()).add({ days: 1 }),
      demo: false,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { date, demo } }) => {
      mutate({
        id: tournamentId,
        date: date.toString(),
        demo,
      })
    },
  })

  return (
    <Modal {...props} onOpenChange={onOpenChange}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <Heading className={title({ size: "sm" })} slot="title">
          Duplicate Tournament
        </Heading>

        <form
          className="flex flex-col space-y-2"
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          <form.AppField
            name="date"
            children={(field) => (
              <field.DatePicker
                isRequired
                label="Date"
                field={field}
                minValue={today(getDefaultTimeZone())}
              />
            )}
          />

          <form.AppField
            name="demo"
            children={(field) => <field.Checkbox label="Demo" field={field} />}
          />

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton requireChange={false}>
                Duplicate
              </form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
