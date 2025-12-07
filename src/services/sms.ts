import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authTokenSid = process.env.TWILIO_AUTH_TOKEN_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;

export async function sendSms(to: string, message: string) {
	if (process.env.TWILIO_ACCOUNT_SID !== "no-send") {
		const client = twilio(authTokenSid, authToken, { accountSid: accountSid });

		const res = await client.messages.create({
			body: message,
			to,
			messagingServiceSid,
		});
	}

	console.log("message", res.sid);
}
