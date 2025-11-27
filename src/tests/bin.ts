import { getMockDb } from "./db";
import { startApp } from "./server";

getMockDb()
	.then(({ url }) => {
		startApp(url)
			.then(() => console.log("success"))
			.catch((err) => console.error(1, err));
	})
	.catch((err) => console.error(0, err));

// startApp().then()
