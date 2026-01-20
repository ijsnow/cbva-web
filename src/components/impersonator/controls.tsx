import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HatGlassesIcon } from "lucide-react";
import { authClient } from "@/auth/client";
import {
	impersonatorQueryOptions,
	useImpersonator,
	viewerQueryOptions,
} from "@/auth/shared";
import { DropdownMenu, DropdownMenuItem } from "../base/dropdown-menu";

export function ImpersonatorControls() {
	const impersonator = useImpersonator();

	const queryClient = useQueryClient();

	const { mutate: stopImpersonating } = useMutation({
		mutationFn: async () => {
			const { data, error } = await authClient.admin.stopImpersonating();

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

	if (!impersonator) {
		return null;
	}

	return (
		<DropdownMenu
			buttonClassName="fixed bottom-3 right-3"
			buttonIcon={<HatGlassesIcon size={16} />}
		>
			<DropdownMenuItem onPress={() => stopImpersonating()}>
				Stop Impersonating
			</DropdownMenuItem>
		</DropdownMenu>
	);
}
