import { useAppForm } from "@/components/base/form";
import {
	paymentCardSchema,
	useUsaePay,
} from "@/components/base/form/fields/payment-key";
import { title } from "@/components/base/primitives";
import {
	registrationPageSchema,
	useCart,
	useCartItems,
	useCartTotal,
} from "@/components/registrations/context";
import {
	checkoutMutationOptions,
	checkoutSchema,
} from "@/functions/payments/checkout";
import { DefaultLayout } from "@/layouts/default";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type z from "zod";

export const Route = createFileRoute("/account/registrations/checkout")({
	validateSearch: registrationPageSchema,
	scripts: () => [
		{
			src: `${import.meta.env.VITE_USAEPAY_BASE_URL}/js/v2/pay.js`,
		},
	],
	component: RouteComponent,
});

const schema = checkoutSchema
	.omit({
		cart: true,
		paymentKey: true,
	})
	.extend({
		paymentCard: paymentCardSchema,
	});

// Test card
//
// https://help.usaepay.info/developer/reference/testcards/
//
// "creditcard": {
//     "cardholder": "John Doe",
//     "number": "4000100011112224",
//     "expiration": "0919",
//     "cvc": "123",
//     "avs_street": "1234 Main",
//     "avs_zip": "12345"
// }

function RouteComponent() {
	const cart = useCart(true);
	const items = useCartItems(true);
	const total = useCartTotal(true);

	const { getPaymentKey, paymentCard } = useUsaePay();

	const { mutate: checkout } = useMutation({
		...checkoutMutationOptions(),
	});

	const form = useAppForm({
		defaultValues: {
			billingInformation: {
				firstName: "",
				lastName: "",
				address: ["", ""],
				city: "",
				state: "",
				postalCode: "",
			},
			paymentCard: {
				cnum: false,
				cvv: false,
				exp: false,
			},
		} as z.infer<typeof schema>,
		validators: {
			onChange: schema,
		},
		onSubmit: async ({ value: { billingInformation } }) => {
			// Get payment key from USAePay here
			const result = await getPaymentKey();

			if (result.error) {
				return {
					form: "Invalid card information.",
				};
			}

			checkout({
				billingInformation,
				paymentKey: result.key,
				cart: {
					memberships: cart.memberships,
					teams: cart.teams.map(({ divisionId, profileIds }) => ({
						divisionId,
						profileIds,
					})),
				},
			});
		},
	});

	if (items.length === 0) {
		return (
			<DefaultLayout>
				<h1 className={title({ className: "text-center" })}>Checkout</h1>

				<div className="max-w-md mx-auto text-center">
					<p className="text-lg text-default-600">Your cart is empty.</p>
				</div>
			</DefaultLayout>
		);
	}

	return (
		<DefaultLayout>
			<h1 className={title({ className: "text-center" })}>Checkout</h1>

			<form
				className="flex flex-col gap-8 max-w-md mx-auto"
				onSubmit={(e) => {
					e.preventDefault();

					form.handleSubmit();
				}}
			>
				<div className="bg-white rounded-lg p-4 pb-6 grid grid-cols-6 gap-3 items-start">
					<h2 className={title({ size: "xs", class: "mb-2 col-span-full" })}>
						Billing Information
					</h2>

					<form.AppField name="billingInformation.firstName">
						{(field) => (
							<field.Text
								className="col-span-3"
								field={field}
								label="First Name"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.lastName">
						{(field) => (
							<field.Text
								className="col-span-3"
								field={field}
								label="Last Name"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.address" mode="array">
						{(field) => (
							<>
								<form.AppField name="billingInformation.address[0]">
									{(subField) => (
										<field.Text
											className="col-span-full"
											field={subField}
											label="Address"
											isRequired={true}
										/>
									)}
								</form.AppField>
								<form.AppField name="billingInformation.address[1]">
									{(subField) => (
										<field.Text
											className="col-span-full"
											field={subField}
											label="Apartment, suite, etc"
										/>
									)}
								</form.AppField>
							</>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.city">
						{(field) => (
							<field.Text
								className="col-span-full"
								field={field}
								label="City"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.state">
						{(field) => (
							<field.Text
								className="col-span-3"
								field={field}
								label="State"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.postalCode">
						{(field) => (
							<field.Text
								className="col-span-3"
								field={field}
								label="Zipcode"
								isRequired={true}
								inputMode="numeric"
							/>
						)}
					</form.AppField>
				</div>

				<form.AppField name="paymentCard">
					{(field) => (
						<field.PaymentKey
							className="bg-white rounded-lg p-4 pb-0"
							field={field}
							label="Billing Information"
							paymentCard={paymentCard}
						/>
					)}
				</form.AppField>

				<form.AppForm>
					<form.SubmitButton size="lg" radius="full">
						Pay ${total}
					</form.SubmitButton>
				</form.AppForm>
			</form>
		</DefaultLayout>
	);
}
