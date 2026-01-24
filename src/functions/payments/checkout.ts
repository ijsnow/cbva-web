import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { memberships } from "@/db/schema";
import { getDefaultTimeZone } from "@/lib/dates";
import { postSale } from "@/services/usaepay";
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

const MEMBERSHIP_PRICE = 100;

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
			if (memberships.length === 0) {
				throw new Error("No memberships in cart");
			}

			const amount = memberships.length * MEMBERSHIP_PRICE;

			const transaction = await postSale({
				paymentKey,
				amount,
				billingAddress: {
					firstName: billingInformation.firstName,
					lastName: billingInformation.lastName,
					street: billingInformation.address.filter(Boolean).join(", "),
					city: billingInformation.city,
					state: billingInformation.state,
					postalCode: billingInformation.postalCode,
				},
				description: `CBVA Membership (${memberships.length})`,
			});

			if (transaction.result_code !== "A") {
				throw new Error(transaction.error || `Payment declined: ${transaction.result}`);
			}

			await createMemberships(
				viewer.id,
				memberships.map((profileId) => ({
					profileId,
					transactionKey: transaction.key,
				})),
			);

			return {
				success: true,
				transactionKey: transaction.key,
				refnum: transaction.refnum,
			};
		},
	);

export const checkoutMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof checkoutSchema>) => checkoutFn({ data }),
	});
