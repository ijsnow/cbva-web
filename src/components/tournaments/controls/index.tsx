import { SettingsIcon } from "lucide-react";
import { useState } from "react";

import { useViewerHasPermission } from "@/auth/shared";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import type { Division, TournamentDivision } from "@/db/schema";

import { AddTeamForm } from "./add-team";
import { CalculateSeedsForm } from "./calculate-seeds";
import { CreatePoolsForm } from "./create-pools";
import { DuplicateForm } from "./duplicate";
import { CreatePoolMatchesForm } from "./create-pool-matches";

export type TournamentAdminControlsProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
};

// type ModalKind = "duplicate" | "add-team" | "calc-seeds" | "gen-pools" | 'gen-pool-matches';

enum ModalKind {
  Duplicate,
  AddTeam,
  CalculateSeeds,
  CreatePools,
  CreatePoolMatches
}

export function TournamentControls({
	tournamentId,
	division,
}: TournamentAdminControlsProps) {
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
   	}
  })

	return (
		<>
			<DropdownMenu
				buttonClassName="absolute top-6 right-6"
				buttonIcon={<SettingsIcon />}
			>
				{canCreate && (
					<DropdownMenuItem onPress={() => setActiveModal(ModalKind.Duplicate)}>
						Duplicate
					</DropdownMenuItem>
				)}

				{canUpdate && (
					<>
						<DropdownMenuItem onPress={() => setActiveModal(ModalKind.AddTeam)}>
							Add Team
						</DropdownMenuItem>
						<DropdownMenuItem onPress={() => setActiveModal(ModalKind.CalculateSeeds)}>
							Calculate Seeds
						</DropdownMenuItem>
						<DropdownMenuItem onPress={() => setActiveModal(ModalKind.CreatePools)}>
							Create Pools
						</DropdownMenuItem>
						<DropdownMenuItem onPress={() => setActiveModal(ModalKind.CreatePoolMatches)}>
							Create Pool Matches
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenu>

			<DuplicateForm
				tournamentId={tournamentId}
				{...makeModalOpenProps(ModalKind.Duplicate)}
			/>

			<AddTeamForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.AddTeam)}
			/>

			<CalculateSeedsForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.CalculateSeeds)}
			/>

			<CreatePoolsForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.CreatePools)}
			/>

			<CreatePoolMatchesForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.CreatePoolMatches)}
			/>
		</>
	);
}
