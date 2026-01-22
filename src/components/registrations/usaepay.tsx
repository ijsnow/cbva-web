import { isServer } from "@tanstack/query-core";
import { useMutation } from "@tanstack/react-query";
import { useMount } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { button } from "../base/button";
import { Alert } from "../base/alert";

import usaepayStyles from "./usaepay.css?inline";
import { useAppForm } from "../base/form";

type PaymentCardConfig = {
	// ...
};

declare class PaymentCard {
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

const usaepay = window.usaepay;

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

export function PayjsForm() {
	const [client] = useState(() => {
		if (isServer) {
			return undefined as unknown as UsaepayClient;
		}

		return new usaepay.Client(import.meta.env.VITE_USAEPAY_PUBLIC_KEY!);
	});

	const [paymentCard] = useState(() => {
		if (isServer) {
			return undefined as unknown as PaymentCard;
		}

		return client.createPaymentCardEntry();
	});

	useMount(() => {
		paymentCard.generateHTML(paymentCardConfig);

		paymentCard.addHTML("paymentCardContainer");
	});

	const { mutate: handleSubmit, failureReason } = useMutation({
		mutationFn: async () => {
			console.log("card", paymentCard);

			const result = await client.getPaymentKey(paymentCard);

			if (result.error) {
				throw result.error.message;
			}

			console.log("result", result);

			return result.key;
		},
	});

	const Form2 = useAppForm({
		// ...
	});

	return (
		<>
			<form
				id="paymentForm"
				className="bg-white rounded-lg max-w-md mx-auto p-4 pb-6"
				onSubmit={(event) => {
					event.preventDefault();

					handleSubmit();
				}}
			>
				{failureReason && (
					<Alert title="Uh oh" description={failureReason.toString()} />
				)}

				<label htmlFor="paymentCardContainer">Credit/Debit Card</label>
				<div id="paymentCardContainer" />
				<div id="paymentCardErrorContainer" />
				<button type="submit" className={button()}>
					Submit Payment Form
				</button>
			</form>

			<form>
				<Form2.AppField name="hello">
					{(field) => <field.Text field={field} />}
				</Form2.AppField>
			</form>
		</>
	);
}
