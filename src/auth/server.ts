import { getRequestHeaders } from "@tanstack/react-start/server";

import type { Session, Viewer } from "./index";
import { auth } from "./index";

export async function getViewer(): Promise<Viewer | null | undefined> {
	const headers = getRequestHeaders();

	const session = await auth.api.getSession({
		headers,
	});

	return {
		...session?.user,
		impersonatedBy: session?.session.impersonatedBy,
	} as Viewer;
}

export type { Session, Viewer };
