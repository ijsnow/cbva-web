export type PaymentCardInfo = {
	cardholder: string;
	paymentKey: string;
	expiration: string;
	cvc: string;
	address: string[];
	postalCode: string;
	invoiceId: string;
};

export async function postSale() {
	// curl -X POST https://sandbox.usaepay.com/api/v2/transactions
	//     -H "Content-Type: application/json"
	//     -H "Authorization: Basic X1Y4N1F0YjUxM0NkM3ZhYk03UkMwVGJ0SldlU284cDc6czIvYWJjZGVmZ2hpamtsbW5vcC9iNzRjMmZhOTFmYjBhMDk3NTVlMzc3ZWU4ZTIwYWE4NmQyYjkyYzNkMmYyNzcyODBkYjU5NWY2MzZiYjE5MGU2"
	//     -d
	//     '{
	//     "command": "cc:sale",
	//     "amount": "5.00",
	//     "amount_detail": {
	//         "tax": "1.00",
	//         "tip": "0.50"
	//     },
	//     "creditcard": {
	//         "cardholder": "John Doe",
	//         "number": "4000100011112224",
	//         "expiration": "0919",
	//         "cvc": "123",
	//         "avs_street": "1234 Main",
	//         "avs_zip": "12345"
	//     },
	//     "invoice": "12356"
	//     }'
}
