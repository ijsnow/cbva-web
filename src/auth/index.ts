import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin as adminPlugin } from "better-auth/plugins/admin"
import { reactStartCookies } from "better-auth/react-start"

import { db } from "@/db/connection"
import * as schema from "@/db/schema/auth"
import { ac, admin, type Role, td, user } from "./permissions"

export const auth = betterAuth({
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        td,
        user,
      },
    }),
    reactStartCookies(),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
    // debugLogs: true,
  }),
  emailAndPassword: {
    enabled: true,
    // Disable signup in production, allow in dev
    disableSignUp: process.env.NODE_ENV === "production",
    minPasswordLength: process.env.NODE_ENV === "production" ? 8 : 1,
    requireEmailVerification: true,
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: true,
      },
      phoneVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      console.log({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      })

      // await sendEmail({
      //   to: user.email,
      //   subject: "Verify your email address",
      //   text: `Click the link to verify your email: ${url}`,
      // });
    },
  },
  trustedOrigins: ["http://localhost:5173"],
})

export type Session = typeof auth.$Infer.Session
export type Viewer = Omit<Session["user"], "role"> & {
  role: Role
}
