import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function getSupabaseServerClient() {
	return createServerClient(
		process.env.VITE_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			cookies: {
				getAll() {
					return Object.entries(getCookies()).map(([name, value]) => ({
						name,
						value,
					}));
				},
				setAll(cookies) {
					cookies.forEach((cookie) => {
						setCookie(cookie.name, cookie.value);
					});
				},
			},
		},
	);
}
