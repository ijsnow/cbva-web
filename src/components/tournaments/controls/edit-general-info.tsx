import {
  type CalendarDate,
  parseDate,
  parseTime,
  type Time,
  today,
} from "@internationalized/date"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { Heading } from "react-aria-components"
import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import {
  editTournamentMutationOptions,
  editTournamentSchema,
  tournamentQueryOptions,
} from "@/data/tournaments"
import { useVenueFilterOptions } from "@/data/venues"
import { getDefaultTimeZone } from "@/lib/dates"
import { calendarDateSchema, timeSchema } from "@/lib/schemas"

export type EditGeneralInfoFormProps = {
  tournamentId: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditGeneralInfoForm({
  tournamentId,
  onOpenChange,
  onSuccess,
  ...props
}: EditGeneralInfoFormProps) {
  const { data: tournament } = useSuspenseQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) =>
      data
        ? {
            date: parseDate(data.date),
            startTime: parseTime(data.startTime),
            venueId: data.venueId,
            name: data.name,
          }
        : undefined,
  })

  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...editTournamentMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(tournamentQueryOptions(tournamentId))

      if (onSuccess) {
        onSuccess()
      }

      onOpenChange(false)
    },
  })

  const schema = editTournamentSchema
    .pick({ venueId: true, name: true })
    .extend({
      date: calendarDateSchema().refine((date) => {
        return true
      }),
      startTime: timeSchema(),
    })

  const form = useAppForm({
    defaultValues: {
      date: tournament?.date as CalendarDate,
      startTime: tournament?.startTime as Time,
      venueId: tournament?.venueId as number,
      name: (tournament?.name ?? null) as string | null,
      mergeDivisions: true,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({
      value: { date, startTime, venueId, name, mergeDivisions },
    }) => {
      mutate({
        id: tournamentId,
        date: date.toString(),
        startTime: startTime.toString(),
        venueId,
        name: name ?? null,
        mergeDivisions,
      })
    },
  })

  const venueOptions = useVenueFilterOptions()

  return (
    <Modal {...props} onOpenChange={onOpenChange}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <Heading className={title({ size: "sm" })} slot="title">
          Edit General Info
        </Heading>

        <form
          className="flex flex-col space-y-3"
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          {failureReason && (
            <form.AppForm>
              <form.Alert
                title={"Unable to edit scheduling"}
                description={failureReason.message}
              />
            </form.AppForm>
          )}

          <form.AppField
            name="venueId"
            children={(field) => (
              <field.ComboBox
                label="Location"
                field={field}
                isRequired={true}
                options={venueOptions.map(({ display, value }) => ({
                  display,
                  value,
                }))}
              />
            )}
          />

          <form.AppField
            name="date"
            children={(field) => (
              <field.DatePicker
                label="Date"
                field={field}
                isRequired={true}
                minValue={today(getDefaultTimeZone())}
              />
            )}
          />

          <form.AppField
            name="startTime"
            children={(field) => (
              <field.Time label="Start Time" isRequired={true} field={field} />
            )}
          />

          <form.AppField
            name="name"
            children={(field) => <field.Text label="Name" field={field} />}
          />

          <form.AppField
            name="mergeDivisions"
            children={(field) => (
              <field.Checkbox
                label="Merge tournaments with same date and location."
                field={field}
              />
            )}
          />

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton requireChange={false}>Save</form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
