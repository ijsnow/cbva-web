import sgMail, { type MailDataRequired } from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY && process.env.LOG_EMAILS !== "true") {
	throw new Error("SENDGRID_API_KEY not set");
}

if (process.env.SENDGRID_API_KEY) {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(message: MailDataRequired) {
	if (process.env.LOG_EMAILS === "true") {
		console.log(message);
	} else {
		sgMail
			.send(message)
			.then((response) => {
				console.log(response[0].statusCode);
				console.log(response[0].headers);
			})
			.catch((error) => {
				console.error(error);
			});
	}
}
