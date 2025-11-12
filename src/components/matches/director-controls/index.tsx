import { SettingsIcon } from "lucide-react";
import { useState } from "react";

import { useViewerHasPermission } from "@/auth/shared";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";

import { OverrideScoreForm } from "./override-score";

export type TournamentDirectorMatchControlsProps = {
	matchId: number;
	setId: number;
};

// type ModalKind = "duplicate" | "add-team" | "calc-seeds" | "gen-pools" | 'gen-pool-matches';

enum ModalKind {
	OverrideScore = 0,
}

export function TournamentDirectorMatchControls({
	matchId,
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
				matchId={matchId}
				setId={setId}
				{...makeModalOpenProps(ModalKind.OverrideScore)}
			/>
		</>
	);
}
