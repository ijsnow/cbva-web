import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { memberships } from "@/db/schema";
import { getDefaultTimeZone } from "@/lib/dates";
import { today } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import z from "zod";

export const cartSchema = z.object({
	memberships: z.array(z.number()).default([]),
});

export const checkoutSchema = z.object({
	billingInformation: z.object({
		firstName: z.string().nonempty(),
		lastName: z.string().nonempty(),
		address: z.array(z.string()).min(1).max(2),
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

const createMemberships = createServerOnlyFn(
	async (
		purchaserId: string,
		membershipTransactions: {
			profileId: number;
			transactionKey: string;
		}[],
	) => {
		const validUntil = today(getDefaultTimeZone())
			.set({
				day: 1,
				month: 1,
			})
			.add({ years: 1 })
			.toString();

		await db.transaction(async (txn) => {
			await Promise.all(
				membershipTransactions.map(({ profileId, transactionKey }) =>
					txn.insert(memberships).values({
						profileId,
						transactionKey,
						purchaserId,
						validUntil,
					}),
				),
			);
		});
	},
);

export const checkoutFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(checkoutSchema)
	.handler(
		async ({
			data: {
				paymentKey,
				billingInformation,
				cart: { memberships },
			},
			context: { viewer },
		}) => {
			await createMemberships(
				viewer.id,
				memberships.map((id, i) => ({
					profileId: id,
					transactionKey: `txn-${i}`,
				})),
			);

			return {
				success: true,
			};
		},
	);

export const checkoutMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof checkoutSchema>) => checkoutFn({ data }),
	});
