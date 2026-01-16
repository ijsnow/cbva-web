import { SettingsIcon } from "lucide-react";
import { useState } from "react";

import { useViewerHasPermission } from "@/auth/shared";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import type { MatchIdProps } from "@/lib/matches";

import { OverrideScoreForm } from "./override-score";

export type TournamentDirectorMatchControlsProps = MatchIdProps & {
	setId: number;
};

enum ModalKind {
	OverrideScore = 0,
}

export function TournamentDirectorMatchControls({
	poolMatchId,
	playoffMatchId,
	setId,
}: TournamentDirectorMatchControlsProps) {
	const canCreate = useViewerHasPermission({
		tournament: ["create"],
	});

	const canUpdate = useViewerHasPermission({
		tournament: ["update"],
	});

	const [activeModal, setActiveModal] = useState<ModalKind>();

	if (![canCreate, canUpdate].some(Boolean)) {
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
		<>
			<DropdownMenu
				buttonClassName="absolute top-6 right-6"
				buttonIcon={<SettingsIcon />}
			>
				{canUpdate && (
					<DropdownMenuItem
						onPress={() => setActiveModal(ModalKind.OverrideScore)}
					>
						Override Score
					</DropdownMenuItem>
				)}
			</DropdownMenu>

			<OverrideScoreForm
				poolMatchId={poolMatchId}
				playoffMatchId={playoffMatchId}
				setId={setId}
				{...makeModalOpenProps(ModalKind.OverrideScore)}
			/>
		</>
	);
}
