import * as Sentry from "@sentry/tanstackstart-react";

export function initSentry() {
	Sentry.init({
		dsn: "https://ee2bb2e4c972c2017c044aede931cef4@o442286.ingest.us.sentry.io/4510468109959168",
		// Setting this option to true will send default PII data to Sentry.
		// For example, automatic IP address collection on events
		sendDefaultPii: true,
	});
}
