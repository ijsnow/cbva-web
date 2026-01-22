import { useAppForm } from "@/components/base/form";
import { title } from "@/components/base/primitives";
import {
	registrationPageSchema,
	useCart,
	useCartTotal,
} from "@/components/registrations/context";
import {
	checkoutMutationOptions,
	checkoutSchema,
} from "@/functions/payments/checkout";
import { DefaultLayout } from "@/layouts/default";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/registrations/checkout")({
	validateSearch: registrationPageSchema,
	component: RouteComponent,
});

const schema = checkoutSchema.omit({
	cart: true,
});

function RouteComponent() {
	const cart = useCart(true);
	const total = useCartTotal(true);

	const { mutate: checkout } = useMutation({
		...checkoutMutationOptions(),
	});

	const form = useAppForm({
		defaultValues: {
			billingInformation: {
				firstName: "",
				lastName: "",
				street: "",
				street2: "",
				city: "",
				state: "",
				postalCode: "",
			},
			paymentInfo: {
				cardNumber: "",
				name: "",
				expiry: "",
				securityCode: "",
			},
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			checkout({
				...value,
				cart: {
					memberships: cart.memberships,
				},
			});
		},
	});

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

					<form.AppField name="billingInformation.street">
						{(field) => (
							<field.Text
								className="col-span-full"
								field={field}
								label="Address"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="billingInformation.street2">
						{(field) => (
							<field.Text
								className="col-span-full"
								field={field}
								label="Apartment, suite, etc"
							/>
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

				<div className="bg-white rounded-lg max-w-md mx-auto p-4 pb-6 grid grid-cols-6 gap-3 items-start">
					<h2 className={title({ size: "xs", class: "mb-2 col-span-full" })}>
						Billing Information
					</h2>

					<form.AppField name="paymentInfo.cardNumber">
						{(field) => (
							<field.PaymentCard
								className="col-span-full"
								field={field}
								label="Card Number"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="paymentInfo.name">
						{(field) => (
							<field.Text
								className="col-span-full"
								field={field}
								label="Name on Card"
								isRequired={true}
							/>
						)}
					</form.AppField>

					<form.AppField name="paymentInfo.expiry">
						{(field) => (
							<field.Expiry
								className="col-span-3"
								field={field}
								label="Expiration"
								isRequired={true}
								placeholder="MM/YY"
							/>
						)}
					</form.AppField>

					<form.AppField name="paymentInfo.securityCode">
						{(field) => (
							<field.Password
								className="col-span-3"
								field={field}
								label="Security Code"
								isRequired={true}
								placeholder="***"
							/>
						)}
					</form.AppField>
				</div>
				<form.AppForm>
					<form.SubmitButton size="lg" radius="full">
						Pay ${total}
					</form.SubmitButton>
				</form.AppForm>
			</form>
		</DefaultLayout>
	);
}
