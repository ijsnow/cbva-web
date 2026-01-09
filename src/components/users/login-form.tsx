import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import z from "zod/v4"
import { authClient } from "@/auth/client"
import { useAppForm } from "@/components/base/form"
import { useLoggedInRedirect } from "@/hooks/auth"
import { Link } from "../base/link"

export type LoginFormProps = {
  className?: string
  next?: string
}

const schema = z.object({
  email: z.email(),
  password: z.string().nonempty({
    message: "This field is required",
  }),
  next: z.string().optional().nullable(),
})

export function LoginForm({ className, next }: LoginFormProps) {
  const navigate = useNavigate()

  const { mutate: login, failureReason } = useMutation({
    mutationFn: async ({ email, password, next }: z.infer<typeof schema>) => {
      const { error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        throw error
      }

      navigate({
        to: next ?? "/account",
      })
    },
  })

  useLoggedInRedirect("/account")

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      login({ ...value, next })
    },
  })

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()

        form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-4 max-w-md">
        {failureReason && (
          <form.Alert
            color="error"
            title="Uh oh!"
            description={failureReason.message}
          />
        )}

        <form.AppField
          name="email"
          children={(field) => (
            <field.Text
              isRequired
              label="Email"
              placeholder="Enter your email"
              type="email"
              field={field}
            />
          )}
        />

        <form.AppField
          name="password"
          children={(field) => (
            <field.Password
              isRequired
              label="Password"
              labelRight={
                <Link to="/account/forgot-password" className="hover:underline">
                  Forgot your password?
                </Link>
              }
              placeholder="Enter your password"
              field={field}
            />
          )}
        />

        <form.AppForm>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => {
              return (
                <form.Footer>
                  <form.SubmitButton
                    className="w-full"
                    isDisabled={Boolean(!canSubmit || isSubmitting)}
                  >
                    Log in
                  </form.SubmitButton>
                </form.Footer>
              )
            }}
          />
        </form.AppForm>
      </div>
    </form>
  )
}
