import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	CircleAlertIcon,
	CircleCheck,
	CircleQuestionMarkIcon,
	EditIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { TooltipTrigger } from "react-aria-components";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import {
	useViewer,
	useViewerHasPermission,
	viewerQueryOptions,
} from "@/auth/shared";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Link } from "@/components/base/link";
import { card, title } from "@/components/base/primitives";
import { Tooltip } from "@/components/base/tooltip";
import { ProfileList } from "@/components/profiles/list";
import { VerifyPhoneForm } from "@/components/users/verify-phone-form";
import { viewerProfileQueryOptions } from "@/data/profiles";
import { updateUserFnSchema, updateUserMutationOptions } from "@/data/users";
import { useNotLoggedInRedirect } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";
import { isUnauthorized } from "@/lib/errors";
import { isTruthy } from "@/utils/types";

export const Route = createFileRoute("/account/")({
	loader: async ({ context: { queryClient } }) => {
		try {
			await queryClient.ensureQueryData(viewerProfileQueryOptions());
		} catch (err) {
			if (isUnauthorized(err)) {
				throw redirect({ to: "/log-in" });
			}

			throw err;
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const viewer = useViewer();

	useNotLoggedInRedirect("/log-in");

	const { data: profiles } = useSuspenseQuery(viewerProfileQueryOptions());

	const [verifyPhoneSent, setVerifyPhoneSent] = useState(false);

	const queryClient = useQueryClient();

	const { mutate: sendOtp } = useMutation({
		mutationFn: async () => {
			if (viewer?.phoneNumber) {
				await authClient.phoneNumber.sendOtp({
					phoneNumber: viewer?.phoneNumber,
				});
			}
		},
		onSuccess: () => {
			setVerifyPhoneSent(true);

			queryClient.invalidateQueries(viewerQueryOptions());
		},
	});

	const phoneValidResult = z.e164().safeParse(viewer?.phoneNumber);

	const { mutate: updateUser, failureReason } = useMutation({
		...updateUserMutationOptions(),
		onSuccess: () => {
			setEdit(false);

			queryClient.invalidateQueries(viewerQueryOptions());
		},
	});

	const schema = updateUserFnSchema
		.omit({ id: true, phoneNumber: true })
		.extend({
			phoneNumber: z.e164({
				error:
					"Invalid phone number. Expected country code (+1 for US) and only required information. Avoid putting parenthesis (), hyphens -, spaces or other unecessary characters.",
			}),
		});

	const form = useAppForm({
		defaultValues: {
			name: viewer?.name,
			email: viewer?.email,
			phoneNumber:
				viewer && phoneValidResult.success ? (viewer.phoneNumber ?? "") : "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			if (viewer) {
				updateUser({
					id: viewer.id,
					...value,
				});
			}
		},
	});

	const [isEdit, setEdit] = useState(false);

	const canDirectTournaments = useViewerHasPermission({
		tournament: ["update"],
	});

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full max-w-3xl mx-auto px-3 flex flex-col space-y-12",
			}}
			sideNavItems={[
				viewer?.role === "admin" && {
					title: "Admin Dashboard",
					to: "/admin" as const,
				},
				canDirectTournaments && {
					title: "TD Dashboard",
					to: "/td" as const,
				},
				{
					title: "Log Out",
					to: "/log-out" as const,
				},
			].filter(isTruthy)}
		>
			<Suspense>
				<h1
					className={title({
						size: "sm",
						class: "flex flex-row justify-between items-center",
					})}
				>
					<span>Account</span>
				</h1>

				<div className={card({ class: "flex flex-col space-y-3 relative" })}>
					{isEdit ? (
						<form
							className="grid grid-cols-6 gap-3"
							onSubmit={(e) => {
								e.preventDefault();

								form.handleSubmit();
							}}
						>
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
										className="col-span-full"
										name="name"
										label="Name"
										field={field}
										isDisabled={true}
										description={
											<p>
												Contact{" "}
												<Link to="mailto:info@cbva.com">info@cbva.com</Link> to
												change this field.
											</p>
										}
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
										isDisabled={true}
										description={
											<p>
												Contact{" "}
												<Link to="mailto:info@cbva.com">info@cbva.com</Link> to
												change this field.
											</p>
										}
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

							<form.AppForm>
								<form.Footer className="col-span-full">
									<Button onPress={() => setEdit(false)}>Cancel</Button>
									<form.SubmitButton>Submit</form.SubmitButton>
								</form.Footer>
							</form.AppForm>
						</form>
					) : (
						<>
							<Button
								size="sm"
								color="primary"
								className="absolute top-3 right-3"
								onPress={() => setEdit(true)}
							>
								<EditIcon size={12} className="-ml mr" />
								Update
							</Button>

							<div className="flex flex-col space-y">
								<span className="font-semibold">Name</span>

								<span>{viewer?.name}</span>
							</div>

							<div className="flex flex-col space-y">
								<span className="font-semibold">Email</span>

								<span>{viewer?.email}</span>
							</div>

							<div>
								<span className="font-semibold">Phone Number</span>

								{!verifyPhoneSent && (
									<div className="flex flex-row justify-between items-center">
										{phoneValidResult.success ? (
											<>
												<span>{viewer?.phoneNumber}</span>

												{viewer?.phoneNumberVerified ? (
													<div className="flex flex-row space-x-1.5 items-center">
														<CircleCheck className="text-green-500" size={16} />
														<span className="text-xs">Verified</span>
													</div>
												) : (
													<Button
														color="primary"
														variant="link"
														size="sm"
														onPress={() => {
															sendOtp();
														}}
													>
														<CircleAlertIcon
															className="text-red-500"
															size={16}
														/>
														Send verification code
													</Button>
												)}
											</>
										) : (
											<TooltipTrigger
												delay={100}
												closeDelay={50}
												trigger="hover"
											>
												<Button
													variant="text"
													className="cursor-default no-underline"
												>
													Not Set{" "}
													<CircleQuestionMarkIcon size={12} className="-ml" />
												</Button>

												<Tooltip
													fill="fill-white"
													className={card({
														class: "max-w-xs p-3 border-none",
													})}
												>
													<div className="flex flex-col space-y">
														<p className="font-semibold">
															If you had a phone number on your account before,
															you either:
														</p>

														<ol className="list-decimal p-3">
															<li>
																Had multiple accounts with the same number and
																we couldn't determine which was the main one.
															</li>
															<li>
																Entered the number in a format that doesn't
																satisfy the new system's validation.
															</li>
														</ol>
													</div>
												</Tooltip>
											</TooltipTrigger>
										)}
									</div>
								)}

								{viewer?.phoneNumber && verifyPhoneSent && (
									<VerifyPhoneForm
										phoneNumber={viewer.phoneNumber}
										onSuccess={() => {
											queryClient.invalidateQueries(viewerQueryOptions());

											setVerifyPhoneSent(false);
										}}
									/>
								)}
							</div>
						</>
					)}
				</div>
			</Suspense>

			<Suspense>
				<div className="flex flex-col space-y-6">
					<h2 className={title({ size: "sm" })}>Your profiles</h2>

					{profiles && <ProfileList className={card()} profiles={profiles} />}
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
