import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HatGlasses } from "lucide-react";
import { authClient } from "@/auth/client";
import {
	impersonatorQueryOptions,
	useViewerHasPermission,
	viewerQueryOptions,
} from "@/auth/shared";
import { Button, type ButtonProps } from "../base/button";

export function ImpersonateButton({
	userId,
	variant,
	color = "secondary",
	...props
}: {
	userId?: string | null;
} & Omit<ButtonProps, "children" | "onPress">) {
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
			{...props}
			color={color}
			variant={variant}
			onPress={() => impersonate(userId)}
		>
			<HatGlasses size={14} className="-ml" />
			{variant !== "icon" && "Impersonate"}
		</Button>
	);
}
