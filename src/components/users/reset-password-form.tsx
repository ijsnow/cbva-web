import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import clsx from "clsx"
import z from "zod/v4"
import { authClient } from "@/auth/client"
import { Alert } from "@/components/base/alert"
import { useAppForm } from "@/components/base/form"
import { useLoggedInRedirect } from "@/hooks/auth"
import { Link } from "../base/link"
import { title } from "../base/primitives"

const schema = z
  .object({
    password: z.string().min(8, { message: "Must be at least 8 characters" }),
    // .refine((password) => /[A-Z]/.test(password), {
    //   message: "Must contain at least 1 upper case letter",
    // })
    // .refine((password) => /[a-z]/.test(password), {
    //   message: "Must contain at least 1 lower case letter",
    // })
    // .refine((password) => /[0-9]/.test(password), {
    //   message: "Must contain at least one number",
    // })
    // .refine((password) => /[!@#$%^&*]/.test(password), {
    //   message: "Must contain at least one special character",
    // }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type CreateUser = z.infer<typeof schema>

export type UserRegistrationFormProps = {
  className?: string
  token?: string
}

export function ResetPasswordForm({
  className,
  token,
}: UserRegistrationFormProps) {
  const navigate = useNavigate()

  const { mutate: reset, failureReason } = useMutation({
    mutationFn: async ({ password }: z.infer<typeof schema>) => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      // todo add toast for success

      navigate({
        to: "/log-in",
      })
    },
  })

  useLoggedInRedirect("/account")

  const form = useAppForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      reset(value)
    },
  })

  if (!token) {
    return (
      <div className={clsx(className, "flex flex-col gap-4")}>
        <h2 className={title({ size: "sm" })}>Uh oh!</h2>

        <p>Something doesn't look right.</p>

        <p>
          Try clicking the link in your email again or restarting the{" "}
          <Link
            to="/account/forgot-password"
            className="underline hover:no-underline"
          >
            Forgot Password
          </Link>{" "}
          process.
        </p>
      </div>
    )
  }

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()

        form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-4 max-w-lg">
        {failureReason && (
          <Alert
            color="error"
            title="Uh oh!"
            description={failureReason.message}
          />
        )}

        <form.AppField
          name="password"
          children={(field) => (
            <field.Password
              isRequired
              name="password"
              className="col-span-full"
              label="Password"
              field={field}
            />
          )}
        />

        <form.AppField
          name="confirmPassword"
          children={(field) => (
            <field.Password
              isRequired
              name="confirmPassword"
              className="col-span-full"
              label="Confirm Password"
              field={field}
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
      </div>
    </form>
  )
}
