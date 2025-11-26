import { adminClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, admin, superadmin, td, user } from "./permissions";

export const authClient = createAuthClient({
	plugins: [
		phoneNumberClient(),
		adminClient({
			ac,
			roles: {
				superadmin,
				admin,
				td,
				user,
			},
		}),
	],
});
