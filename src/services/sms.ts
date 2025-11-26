import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;

console.log({
	accountSid,
	authToken,
	messagingServiceSid,
});

export async function sendSms(to: string, message: string) {
	const client = twilio(accountSid, authToken);

	const res = await client.messages.create({
		body: message,
		to,
		messagingServiceSid,
	});

	console.log("message", res.sid);
}
