import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const cartSchema = z.object({
	memberships: z.array(z.number()).default([]),
});

export const checkoutSchema = z.object({
	billingInformation: z.object({
		firstName: z.string().nonempty(),
		lastName: z.string().nonempty(),
		street: z.string().nonempty(),
		street2: z.string().optional(),
		city: z.string().nonempty(),
		state: z.string().nonempty(),
		postalCode: z.string().nonempty(),
	}),
	paymentKey: z.string(),
	// paymentInfo: z.object({
	// 	cardNumber: z.string().nonempty(),
	// 	name: z.string().nonempty(),
	// 	expiry: z.string().nonempty(),
	// 	securityCode: z.string().nonempty(),
	// }),
	cart: cartSchema,
});

export const checkoutFn = createServerFn()
	.inputValidator(checkoutSchema)
	.handler(({ data }) => {
		console.log(JSON.stringify(data, null, 2));

		return {
			success: true,
		};
	});

export const checkoutMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof checkoutSchema>) => checkoutFn({ data }),
	});
