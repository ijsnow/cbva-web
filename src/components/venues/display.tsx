import { useMutation } from "@tanstack/react-query";
import { Suspense } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { updateVenueMutationOptions } from "@/data/venues";
import type {
	Director,
	PlayerProfile,
	TournamentDirector,
	Venue,
	VenueDirector,
} from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { subtitle } from "../base/primitives";
import { RichTextDisplay } from "../base/rich-text-editor/display";
import { AddDirector } from "../directors/add";
import { RemoveDirector } from "../directors/remove";

export type VenueDisplayProps<TournamentId extends number | undefined> = {
	tournamentId?: TournamentId;
	venue: Pick<
		Venue,
		"id" | "name" | "city" | "description" | "directions" | "mapUrl"
	> & {
		directors: ((TournamentId extends number
			? TournamentDirector
			: VenueDirector) & {
			director: Director & { profile: PlayerProfile };
		})[];
	};
	onEditSuccess?: () => void;
};

export function VenueDisplay<TournamentId extends number | undefined>({
	tournamentId,
	venue,
	onEditSuccess,
}: VenueDisplayProps<TournamentId>) {
	const canEdit = useViewerHasPermission({
		venues: ["update"],
	});

	const { mutateAsync: updateVenue } = useMutation({
		...updateVenueMutationOptions(),
		onSuccess: onEditSuccess,
	});

	return (
		<Suspense>
			<div className="max-w-4xl mx-auto pt-12 px-3">
				<h4 className={subtitle()}>Director Notes</h4>

				<div className="flex flex-col sm:flex-row gap-3 pb-12">
					<RichTextDisplay
						name="venue-description"
						content={
							typeof venue.description === "string"
								? JSON.parse(venue.description)
								: venue.description
						}
						onSave={
							canEdit
								? async (state) => {
										await updateVenue({
											id: venue.id,
											description: state as LexicalState,
										});
									}
								: undefined
						}
					/>

					<div className="relative flex flex-col space-y-3 min-w-3/12">
						<h5 className="font-semibold flex flex-row justify-between items-center">
							<span>Director</span>

							{canEdit && (
								<AddDirector
									mode={tournamentId ? "tournament" : "venue"}
									targetId={tournamentId ?? venue.id}
									existingDirectorIds={venue.directors.map((d) => d.directorId)}
								/>
							)}
						</h5>

						<div className="flex flex-col space-y-2">
							{venue.directors.map((td) => {
								const name = `${td.director.profile.preferredName || td.director.profile.firstName} ${td.director.profile.lastName}`;

								return (
									<ul key={td.id} className="relative">
										<li className="flex flex-row justify-between items-center relative whitespace-nowrap overflow-ellipsis">
											<span>{name}</span>

											{canEdit && (
												<RemoveDirector
													id={td.id}
													name={name}
													mode={tournamentId ? "tournament" : "venue"}
													targetId={tournamentId ?? venue.id}
													isDisabled={venue.directors.length === 1}
												/>
											)}
										</li>
										{td.director.email && <li>{td.director.email}</li>}
										{td.director.phoneNumber && (
											<li>{td.director.phoneNumber}</li>
										)}
									</ul>
								);
							})}
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-3 border-t py-12 border-gray-300">
					<h4 className={subtitle()}>Directions</h4>

					<RichTextDisplay
						name="venue-directions"
						content={
							typeof venue.directions === "string"
								? JSON.parse(venue.directions)
								: venue.directions
						}
						onSave={
							canEdit
								? async (state) => {
										await updateVenue({
											id: venue.id,
											directions: state as LexicalState,
										});
									}
								: undefined
						}
					/>
				</div>
			</div>
			{venue.mapUrl?.startsWith("https://www.google.com") && (
				<iframe
					title="google maps"
					loading="lazy"
					height={350}
					style={{ border: "none", width: "100%", outline: "none" }}
					allowFullScreen
					referrerPolicy="no-referrer-when-downgrade"
					src={venue.mapUrl}
				/>
			)}
		</Suspense>
	);
}
