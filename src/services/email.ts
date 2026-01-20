import sgMail, { type MailDataRequired } from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY && process.env.LOG_EMAILS !== "true") {
	throw new Error("SENDGRID_API_KEY not set");
}

if (
	process.env.SENDGRID_API_KEY &&
	process.env.SENDGRID_API_KEY !== "no-send"
) {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(message: MailDataRequired) {
	if (process.env.LOG_EMAILS === "true") {
		console.log(message);
	} else if (process.env.SENDGRID_API_KEY !== "no-send") {
		console.log(`sendEmail(to: ${message.to}, subject: ${message.subject})`);

		sgMail
			.send(message)
			.then(([result]) => {
				console.log(
					`sendEmail result status: ${result.statusCode}`,
					result.body,
				);
			})
			.catch((err) => {
				console.error("sendEmail error:", err);
			});
	}
}
