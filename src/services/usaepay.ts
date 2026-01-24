import { createHash, randomBytes } from "node:crypto";

const USAEPAY_BASE_URL = process.env.VITE_USAEPAY_BASE_URL!;
const USAEPAY_PRIVATE_KEY = process.env.USAEPAY_PRIVATE_KEY!;
const USAEPAY_PRIVATE_KEY_PIN = process.env.USAEPAY_PRIVATE_KEY_PIN!;

export type BillingAddress = {
	firstName: string;
	lastName: string;
	street: string;
	city: string;
	state: string;
	postalCode: string;
};

export type SaleRequest = {
	paymentKey: string;
	amount: number;
	invoice?: string;
	billingAddress: BillingAddress;
	description?: string;
};

export type TransactionResponse = {
	type: "transaction";
	key: string;
	refnum: string;
	result_code: "A" | "D" | "E" | "P" | "V";
	result: string;
	authcode: string;
	auth_amount: number;
	error?: string;
};

// var sha256 = require('sha256');
//
// var seed = "abcdefghijklmnop"
// var apikey = "_V87Qtb513Cd3vabM7RC0TbtJWeSo8p7"
// var apipin = "123456"
// var prehash = apikey + seed + apipin;
// var apihash = 's2/'+ seed + '/' + sha256(prehash);
// var authKey = new Buffer(apikey + ":" + apihash).toString('base64')
// console.log("Authorization: Basic " + authKey);
function generateAuthHeader(): string {
	// USAePay uses a seed-based hash for authentication
	// Format: apiKey:s2/{seed}/{hash}
	// Hash = SHA256(apiKey + seed + apiPin)
	const seed = randomBytes(16).toString("hex");
	const preHash = `${USAEPAY_PRIVATE_KEY}${seed}${USAEPAY_PRIVATE_KEY_PIN}`;
	const hash = createHash("sha256").update(preHash).digest("hex");
	const authString = `${USAEPAY_PRIVATE_KEY}:s2/${seed}/${hash}`;
	return `Basic ${Buffer.from(authString).toString("base64")}`;
}

export async function postSale(
	request: SaleRequest,
): Promise<TransactionResponse> {
	const response = await fetch(`${USAEPAY_BASE_URL}/api/v2/transactions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: generateAuthHeader(),
		},
		body: JSON.stringify({
			command: "cc:sale",
			payment_key: request.paymentKey,
			amount: request.amount.toFixed(2),
			invoice: request.invoice,
			amount_detail: {
				subtotal: request.amount.toFixed(2),
				tax: "0.00",
			},
			billing_address: {
				firstname: request.billingAddress.firstName,
				lastname: request.billingAddress.lastName,
				street: request.billingAddress.street,
				city: request.billingAddress.city,
				state: request.billingAddress.state,
				postalcode: request.billingAddress.postalCode,
			},
			description: request.description,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || `USAePay request failed: ${response.status}`);
	}

	return data as TransactionResponse;
}
