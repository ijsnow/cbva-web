import { Link, useNavigate } from "@tanstack/react-router"
import { z } from "zod/v4"
import { button } from "@/components/button"
import { useAppForm } from "@/components/form"
import type { CreateVenueParams } from "@/generated/CreateVenueParams"
import { useCreateVenue } from "@/hooks/venues"

const schema = z.object({
  name: z.string().nonempty({
    message: "This field is required",
  }),
  city: z.string().nonempty({
    message: "This field is required",
  }),
  description: z.string(),
  photo: z.file(),
})

export function CreateVenue() {
  const { mutate, failureReason } = useCreateVenue()

  const navigate = useNavigate()

  const form = useAppForm({
    defaultValues: {
      name: "",
      city: "",
      description: "",
    } as Partial<CreateVenueParams>,
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      mutate(value as CreateVenueParams, {
        onSuccess: (venue) => {
          navigate({
            to: "/venue/$venueId",
            params: {
              venueId: venue.id.toString(),
            },
          })
        },
      })
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()

        form.handleSubmit()
      }}
    >
      {/* <Form
        onSubmit={async ({ formData, data }) => {
          if (!formData.has("photo") && data.photo) {
            formData.append("photo", data.photo);
          }

          await createVenue(formData);
        }}
        onSuccess={({}: CreateVenueParams, {}: Venue) => {}}
        fields={[
          {
            kind: "text",
            label: <>Name</>,
            required: true,
            name: "name",
          },
          {
            kind: "text",
            label: <>City</>,
            name: "city",
          },
          {
            kind: "textarea",
            label: <>Description</>,
            name: "description",
          },
          {
            kind: "image",
            label: <>Photo</>,
            name: "photo",
          },
        ]}
      /> */}
      {failureReason && (
        <form.Alert
          color="error"
          title="Uh oh!"
          description={failureReason.message}
        />
      )}

      <form.AppField
        name="name"
        children={(field) => (
          <field.Text
            isRequired
            label="Name"
            placeholder="Main Beach"
            field={field}
          />
        )}
      />

      <form.AppField
        name="city"
        children={(field) => (
          <field.Text
            isRequired
            label="City"
            placeholder="Santa Cruz"
            field={field}
          />
        )}
      />

      <form.AppField
        name="description"
        children={(field) => (
          <field.TextArea
            label="Description"
            placeholder="Its a great place to play some volleyball."
            field={field}
          />
        )}
      />

      <form.AppField
        name="photo"
        children={(field) => (
          <field.Image label="Photo" field={field} isRequired />
        )}
      />

      <form.AppForm>
        <form.Footer>
          <Link to="/venue" className={button()}>
            Back to Locations
          </Link>
          <form.SubmitButton>Create</form.SubmitButton>
        </form.Footer>
      </form.AppForm>
    </form>
  )
}
