import { parseDate, parseTime } from "@internationalized/date";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import type { Tournament } from "@/db/schema";
import { isDefined, isNotNull } from "@/utils/types";
import { DivisionsForm } from "./divisions";
import { UpsertTournamentForm } from "./general-info";

export type TournamentFormsGroup = {
	tournament?: Pick<
		Tournament,
		"id" | "name" | "date" | "startTime" | "venueId"
	>;
};

export function TournamentFormsGroup({ tournament }: TournamentFormsGroup) {
	return (
		<DisclosureGroup
			className="w-full max-w-lg mx-auto bg-white"
			defaultExpandedKeys={["general"].filter(isNotNull)}
		>
			<Disclosure id="general" defaultExpanded={true}>
				<DisclosureHeader>General Info</DisclosureHeader>
				<DisclosurePanel>
					<UpsertTournamentForm
						tournamentId={tournament?.id}
						defaultValues={
							tournament
								? {
										name: tournament.name,
										date: parseDate(tournament.date),
										startTime: parseTime(tournament.startTime),
										venueId: tournament.venueId,
									}
								: undefined
						}
					/>
				</DisclosurePanel>
			</Disclosure>
			<Disclosure id="divisions" isDisabled={!isDefined(tournament?.id)}>
				<DisclosureHeader>Divisions</DisclosureHeader>
				<DisclosurePanel>
					<div className="flex flex-col w-full space-y-3">
						{tournament && <DivisionsForm tournamentId={tournament.id} />}
					</div>
				</DisclosurePanel>
			</Disclosure>
		</DisclosureGroup>
	);
}
