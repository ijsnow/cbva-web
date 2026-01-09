import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
// import { BetterAuthError } from "better-auth";
import z from "zod/v4"

import { authClient } from "@/auth/client"
import { Alert } from "@/components/base/alert"
import { useAppForm } from "@/components/base/form"
// import { ConflictError, useRegisterUser } from "@/hooks/auth";
import { useLoggedInRedirect } from "@/hooks/auth"

const schema = z
  .object({
    name: z.string(),
    email: z.email(),
    phoneNumber: z.e164(),
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
}

export function RegisterUserForm({ className }: UserRegistrationFormProps) {
  const navigate = useNavigate()

  const { mutate: registerUser, failureReason } = useMutation({
    mutationFn: async ({ confirmPassword: _, ...user }: CreateUser) => {
      const { data, error } = await authClient.signUp.email({
        ...user,
        callbackURL: "/account/verify/success",
      })

      if (error) {
        throw error
      }

      navigate({
        to: "/account/verify",
        search: {
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      })
    },
  })

  useLoggedInRedirect("/account/verify")

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      registerUser(value)
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
      <div className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-8">
          Step 1: Account Information
        </h2>

        {failureReason && (
          <Alert
            color="error"
            title="Uh oh!"
            description={
              failureReason.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ? (
                <>
                  It looks like you may already have an account with us. Did you
                  mean to{" "}
                  <a className="underline hover:no-underline" href="/sign-in">
                    log in
                  </a>
                  ? If you're having trouble accessing your account, consider{" "}
                  <a className="underline hover:no-underline" href="/sign-in">
                    resetting your password
                  </a>
                  .
                </>
              ) : (
                failureReason.message
              )
            }
          />
        )}

        <form.AppField
          name="name"
          children={(field) => (
            <field.Text
              isRequired
              className="col-span-full"
              name="name"
              label="Name"
              field={field}
            />
          )}
        />

        <form.AppField
          name="email"
          children={(field) => (
            <field.Text
              isRequired
              className="col-span-full"
              name="email"
              label="Email"
              placeholder="name@example.com"
              field={field}
            />
          )}
        />

        <form.AppField
          name="phoneNumber"
          children={(field) => (
            <field.Text
              isRequired
              className="col-span-full"
              name="phoneNumber"
              label="Phone"
              type="tel"
              placeholder="+15555555555"
              field={field}
            />
          )}
        />

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
