import { isServer } from "@tanstack/query-core";
import { useMutation } from "@tanstack/react-query";
import { useMount } from "ahooks";
import { useState } from "react";
import z from "zod";

import { FieldProps } from "../shared";
import { title } from "@/components/base/primitives";

import "./container.css";
import usaepayStyles from "./styles.css?inline";

type PaymentCardConfig = {
	styles: string;
};

declare class PaymentCard extends EventTarget {
	constructor();

	generateHTML(config: PaymentCardConfig): void;
	addHTML(targetId: string): void;
}

type GetPaymentKeyResult =
	| {
			key: string;
			type: "payment_key";
			creditcard: {
				number: string;
				cardtype: string;
			};
			error?: undefined;
	  }
	| { key?: undefined; error: { message: string } };

declare class UsaepayClient {
	constructor(publicKey: string);

	createPaymentCardEntry(): PaymentCard;
	getPaymentKey(card: PaymentCard): Promise<GetPaymentKeyResult>;
}

interface Usaepay {
	Client: typeof UsaepayClient;
}

declare global {
	interface Window {
		usaepay: Usaepay;
	}
}

// Test card
//
// "creditcard": {
//     "cardholder": "John Doe",
//     "number": "4000100011112224",
//     "expiration": "0919",
//     "cvc": "123",
//     "avs_street": "1234 Main",
//     "avs_zip": "12345"
// }

const paymentCardConfig = {
	display_labels: true,
	labels: {
		cnum: "Card Number",
		exp: "Expiration Date",
		cvv: "Security Code",
	},
	label_position: "top", // or 'bottom'
	placeholders: {
		cnum: "1234 5678 9012 3456",
		exp: "MM/YY",
		cvv: "123",
	},
	styles: usaepayStyles,
};

export const paymentCardSchema = z.object({
	cnum: z.boolean().refine((value) => value, {
		error: "Enter a valid credit number.",
	}),
	cvv: z.boolean().refine((value) => value, {
		error: "Enter a valid security code.",
	}),
	exp: z.boolean().refine((value) => value, {
		error: "Enter a valid expiration date.",
	}),
});

export function useUsaePay() {
	const [client] = useState(() => {
		if (isServer) {
			return undefined as unknown as UsaepayClient;
		}

		return new window.usaepay.Client(import.meta.env.VITE_USAEPAY_PUBLIC_KEY!);
	});

	const [paymentCard] = useState(() => {
		if (isServer) {
			return undefined as unknown as PaymentCard;
		}

		return client.createPaymentCardEntry();
	});

	const { mutateAsync: getPaymentKey, failureReason } = useMutation({
		mutationFn: async () => {
			const result = await client.getPaymentKey(paymentCard);

			return result;
		},
	});

	return {
		client,
		paymentCard,
		failureReason,
		getPaymentKey,
	};
}

type PaymentKeyFieldProps = FieldProps & {
	className?: string;
	// client: UsaepayClient;
	paymentCard: PaymentCard;
};

export function PaymentKeyField({
	className,
	paymentCard,
	field,
}: PaymentKeyFieldProps) {
	useMount(() => {
		paymentCard.generateHTML(paymentCardConfig);

		paymentCard.addHTML("paymentCardContainer");

		const handleError = (err) => {
			console.log("paymentCard.error", err);
		};

		const handleValid = (key: "cnum" | "cvv" | "exp") => {
			console.log("paymentCard.valid", key);

			field.setValue((value) => ({
				...value,
				[key]: true,
			}));

			field.handleBlur();
		};

		const handleInvalid = (key: "cnum" | "cvv" | "exp") => {
			console.log("paymentCard.invalid", key);

			field.setValue((value) => ({
				...value,
				[key]: false,
			}));
		};

		paymentCard.addEventListener("error", handleError);
		paymentCard.addEventListener("valid", handleValid);
		paymentCard.addEventListener("invalid", handleInvalid);

		// return () => {
		// 	paymentCard.removeEventListener("error", handleError);
		// 	paymentCard.removeEventListener("valid", handleValid);
		// 	paymentCard.removeEventListener("invalid", handleInvalid);
		// };
	});

	return (
		<div id="paymentForm" className={className}>
			{/* {failureReason && ( */}
			{/* 	<Alert title="Uh oh" description={failureReason.toString()} /> */}
			{/* )} */}

			<div className="flex flex-col gap-y-2">
				<h2 className={title({ size: "xs", class: "mb-2 col-span-full" })}>
					Payment Information
				</h2>

				<div id="paymentCardContainer" />
				<div id="paymentCardErrorContainer" />
			</div>
		</div>
	);
}
