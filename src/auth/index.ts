import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { reactStartCookies } from "better-auth/react-start";
import { db } from "@/db/connection";
import * as schema from "@/db/schema/auth";
import { sendEmail } from "@/services/email";
import { sendSms } from "@/services/sms";
import { ac, admin, type Role, superadmin, td, user } from "./permissions";

const AUTH_EMAIL_SENDER = process.env.AUTH_EMAIL_SENDER;

export const auth = betterAuth({
	plugins: [
		phoneNumber({
			sendOTP: async ({ phoneNumber, code }) => {
				await sendSms(phoneNumber, `CBVA verification code: ${code}`);
			},
		}),
		adminPlugin({
			ac,
			roles: {
				superadmin,
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
		// disableSignUp: process.env.NODE_ENV === "production",
		minPasswordLength: process.env.NODE_ENV === "production" ? 8 : 1,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			if (!AUTH_EMAIL_SENDER) {
				throw new Error("AUTH_EMAIL_SENDER not set");
			}

			await sendEmail({
				to: user.email,
				from: AUTH_EMAIL_SENDER,
				subject: "Reset your password",
				text: `Copy and paste the link into your browser to reset your password: ${url}`,
				html: `Click the link to reset your password: <a href="${url}">${url}</a>`,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			if (!AUTH_EMAIL_SENDER) {
				throw new Error("AUTH_EMAIL_SENDER not set");
			}

			await sendEmail({
				to: user.email,
				from: AUTH_EMAIL_SENDER,
				subject: "Verify your email address",
				text: `Copy and paste the link into your browser to verify your email: ${url}`,
				html: `Click the link to verify your email: <a href="${url}">${url}</a>`,
			});
		},
	},
	trustedOrigins: ["http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
export type Viewer = Omit<Session["user"], "role"> & {
	role: Role;
	impersonatedBy: Session["session"]["impersonatedBy"];
};
