import { useViewerHasPermission } from "@/auth/shared";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import { MenuSection } from "@/components/base/menu";
import { useTeamsAtCapacity } from "@/components/tournaments/context";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

enum ModalKind {
	Remove = 0,
	Abandoned = 1,
}

export function TeamControlsDropdown() {
	const canUpdate = useViewerHasPermission({
		tournament: ["update"],
	});

	const [activeModal, setActiveModal] = useState<ModalKind>();

	if (!canUpdate) {
		return null;
	}

	const makeModalOpenProps = (kind: ModalKind) => ({
		isOpen: activeModal === kind,
		onOpenChange: (open: boolean) => {
			const next = open ? kind : undefined;

			setActiveModal(next);
		},
	});

	return (
		<DropdownMenu buttonIcon={<SettingsIcon />}>
			<MenuSection title="Team Controls">
				<DropdownMenuItem onPress={() => setActiveModal(ModalKind.Remove)}>
					Remove Team
				</DropdownMenuItem>
				<DropdownMenuItem onPress={() => setActiveModal(ModalKind.Abandoned)}>
					Abandoned Ref
				</DropdownMenuItem>
			</MenuSection>
		</DropdownMenu>
	);
}
