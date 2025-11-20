import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./index";
import { ac, admin, superadmin, td, user } from "./permissions";

export const authClient = createAuthClient({
	plugins: [
		adminClient({
			ac,
			roles: {
				superadmin,
				admin,
				td,
				user,
			},
		}),
		inferAdditionalFields<typeof auth>(),
	],
});
