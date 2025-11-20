import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HatGlasses } from "lucide-react";
import { authClient } from "@/auth/client";
import {
	impersonatorQueryOptions,
	useViewerHasPermission,
	viewerQueryOptions,
} from "@/auth/shared";
import { Button } from "../base/button";

export function ImpersonateButton({ userId }: { userId?: string | null }) {
	const canImpersonate = useViewerHasPermission({
		user: ["impersonate"],
	});

	const queryClient = useQueryClient();

	const { mutate: impersonate } = useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await authClient.admin.impersonateUser({
				userId: id,
			});

			if (error) {
				throw error;
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(viewerQueryOptions());
			queryClient.invalidateQueries(impersonatorQueryOptions());
		},
	});

	if (!canImpersonate || !userId) {
		return null;
	}

	return (
		<Button
			className="absolute top-6 right-6"
			color="secondary"
			onPress={() => impersonate(userId)}
		>
			<HatGlasses size={14} className="-ml" />
			Impersonate
		</Button>
	);
}
