import { SettingsIcon } from "lucide-react";
import { useState } from "react";

import { useViewerHasPermission } from "@/auth/shared";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import { MenuSection } from "@/components/base/menu";
import type { Division, TournamentDivision } from "@/db/schema";
import { AddTeamForm } from "./add-team";
import { CalculateSeedsForm } from "./calculate-seeds";
import { CompletePoolsForm } from "./complete-pools";
import { CreatePlayoffsForm } from "./create-playoffs";
import { CreatePoolMatchesForm } from "./create-pool-matches";
import { CreatePoolsForm } from "./create-pools";
import { DuplicateForm } from "./duplicate";
import { EditDivisionsForm } from "./edit-divisions";
import { FillTournamentForm } from "./fill-tournament";
import { SimulateMatchesForm } from "./simulate-matches";

export type TournamentAdminControlsProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
};

enum ModalKind {
	Duplicate = 0,
	AddTeam = 1,
	CalculateSeeds = 2,
	CreatePools = 3,
	CreatePoolMatches = 4,
	SimulateMatches = 5,
	CreatePlayoffs = 6,
	CompletePools = 7,
	FillTournament = 8,
	EditDivisions = 9,
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
		},
	});

	return (
		<>
			<DropdownMenu
				buttonClassName="absolute top-6 right-6"
				buttonIcon={<SettingsIcon />}
			>
				{canCreate && (
					<MenuSection title="Admin Controls">
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.Duplicate)}
						>
							Duplicate
						</DropdownMenuItem>
					</MenuSection>
				)}

				{canUpdate && (
					<MenuSection title="Tournament Controls">
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.EditDivisions)}
						>
							Edit Divisions
						</DropdownMenuItem>
						<DropdownMenuItem onPress={() => setActiveModal(ModalKind.AddTeam)}>
							Add Team
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.FillTournament)}
						>
							Fill Tournament
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.CalculateSeeds)}
						>
							Calculate Seeds
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.CreatePools)}
						>
							Create Pools
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.CreatePoolMatches)}
						>
							Create Pool Matches
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.SimulateMatches)}
						>
							Simulate Matches
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.CompletePools)}
						>
							Complete Pools
						</DropdownMenuItem>
						<DropdownMenuItem
							onPress={() => setActiveModal(ModalKind.CreatePlayoffs)}
						>
							Create Playoffs
						</DropdownMenuItem>
					</MenuSection>
				)}
			</DropdownMenu>

			<EditDivisionsForm
				tournamentId={tournamentId}
				{...makeModalOpenProps(ModalKind.EditDivisions)}
			/>

			<DuplicateForm
				tournamentId={tournamentId}
				{...makeModalOpenProps(ModalKind.Duplicate)}
			/>

			<AddTeamForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.AddTeam)}
			/>

			<FillTournamentForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.FillTournament)}
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

			<SimulateMatchesForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.SimulateMatches)}
			/>

			<CompletePoolsForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.CompletePools)}
			/>

			<CreatePlayoffsForm
				tournamentId={tournamentId}
				division={division}
				{...makeModalOpenProps(ModalKind.CreatePlayoffs)}
			/>
		</>
	);
}
