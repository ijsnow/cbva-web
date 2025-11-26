import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import z from "zod";
import { authClient } from "@/auth/client";
import { useViewer } from "@/auth/shared";
import { Button } from "@/components/base/button";
import { VerifyPhoneForm } from "@/components/users/verify-phone-form";
import { useRedirect } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";

const verifyUrlSchema = z.object({
	email: z.string().default(""),
	phoneNumber: z.string().default(""),
});

export const Route = createFileRoute("/account/verify/")({
	validateSearch: zodValidator(verifyUrlSchema),
	head: () => ({
		meta: [
			{
				title: "CBVA: Verify your information",
			},
		],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { email, phoneNumber } = Route.useSearch();

	const viewer = useViewer();

	const phoneNumberVerified =
		viewer?.phoneNumberVerified && phoneNumber === viewer?.phoneNumber;

	useRedirect(
		"/account/verify/success",
		Boolean(viewer?.emailVerified && phoneNumberVerified),
	);

	const [verifyPhoneSent, setVerifyPhoneSent] = useState(false);

	const { mutate: sendOtp } = useMutation({
		mutationFn: async () => {
			await authClient.phoneNumber.sendOtp({
				phoneNumber,
			});
		},
		onSuccess: () => {
			setVerifyPhoneSent(true);
		},
	});

	/// 1. If not authenticated/email verified
	///  a. Show thing about looking for email
	///  b. Show form to edit email or send again
	/// 2. Whether or not authenticated and if not phone verified
	///  a. Show form with option to verify by phone
	/// 3. If Authenticated but not both verified
	///  a. Show link to profile
	///
	/// For all, need sign-up endpoint to return user info.
	///
	/// If 1b, need endpoint to modify partial user info
	///   Api token? authenticate with minimal permissions?

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-4 max-w-xl mx-auto">
				<h1 className="text-5xl font-panton-narrow-extrabold font-extrabold">
					SIGN UP TO BECOME A CBVA MEMBER
				</h1>
			</div>

			<div className="rounded-md bg-white p-8 max-w-xl mx-auto">
				<h2 className="text-2xl font-bold text-center mb-8">
					Step 2: Verify your contact information
				</h2>

				<div className="space-y-4">
					<div className="space-y-3">
						<h3 className="text-lg font-semibold">Verify your email</h3>
						<p>A confirmation email has been sent to:</p>
						<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold">
							{email}
						</p>
						<p>
							To complete the registration process, please check your inbox and
							follow the provided link within the next 3 hours. If the email is
							incorrect, you can{" "}
							<Link to="/log-in" className="underline hover:no-underline">
								log in
							</Link>
							, and request another confirmation email to be sent to a different
							address.
						</p>
					</div>

					<hr className="border-gray-300" />

					<div className="space-y-3">
						<h3 className="text-lg font-semibold">Verify your phone number</h3>

						{phoneNumberVerified && (
							<div>Phone number successfully verified.</div>
						)}

						{!phoneNumberVerified && !verifyPhoneSent && (
							<>
								<p>
									Click the button below to get a verification code sent to:
								</p>
								<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold mb-5">
									{phoneNumber}
								</p>
								<Button
									color="primary"
									onClick={() => {
										console.log("hello");

										sendOtp();
									}}
								>
									Send Code
								</Button>
							</>
						)}

						{!phoneNumberVerified && verifyPhoneSent && (
							<>
								<p>Use the form below to enter the code sent to:</p>

								<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold">
									{phoneNumber}
								</p>

								<VerifyPhoneForm phoneNumber={phoneNumber} />
							</>
						)}
					</div>
				</div>
			</div>
		</DefaultLayout>
	);
}
