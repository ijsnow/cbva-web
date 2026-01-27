import { cartSchema } from "@/functions/payments/checkout";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { getSettingQueryOptions } from "@/functions/settings/get-setting";
import { getTournamentDivisionsQueryOptions } from "@/functions/tournament-divisions/get-tournament-divisions";
import { isDefined } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { groupBy, sum, uniqBy } from "lodash-es";
import { createContext, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

// Context for tracking the currently dragged profile
type DragContextValue = {
	draggedProfile: CartProfile | null;
	setDraggedProfile: (profile: CartProfile | null) => void;
};

export const DragContext = createContext<DragContextValue | null>(null);

export function useDraggedProfile() {
	const context = useContext(DragContext);
	return context?.draggedProfile ?? null;
}

export function useSetDraggedProfile() {
	const context = useContext(DragContext);
	return context?.setDraggedProfile ?? (() => {});
}

export const registrationPageSchema = cartSchema.extend({
	profiles: z.array(z.number()).default([]),
	teams: z
		.array(
			z.object({
				id: z.uuidv4().default(uuidv4()),
				divisionId: z.number(),
				profileIds: z.array(z.number()),
			}),
		)
		.default([]),
});

export function useCartProfiles(checkout?: boolean) {
	const { profiles: profileIds } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	const { data: viewerProfiles } = useSuspenseQuery({
		...getViewerProfilesQueryOptions(),
		select: (data) => {
			return data.map((profile) => ({
				...profile,
				registrations: 0,
			}));
		},
	});

	const { data: otherProfiles } = useSuspenseQuery({
		...getProfilesQueryOptions({
			ids: profileIds,
		}),
		select: (data) => {
			return data.map((profile) => ({
				...profile,
				registrations: 0,
			}));
		},
	});

	return uniqBy(viewerProfiles.concat(otherProfiles), "id");
}

export type CartProfile = ReturnType<typeof useCartProfiles>[number];

export function useCartDivisionRegistrations(checkout?: boolean) {
	const { teams } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	const divisions = groupBy(teams, "divisionId");

	return Object.entries(divisions).map(([divisionId, teams]) => ({
		divisionId: Number.parseInt(divisionId, 10),
		teams,
	}));
}

export function useCartDivisions(checkout?: boolean) {
	const registrations = useCartDivisionRegistrations(checkout);
	const divisionIds = registrations.map((r) => r.divisionId);

	const { data } = useSuspenseQuery({
		...getTournamentDivisionsQueryOptions(divisionIds),
		select: (data) =>
			data.map((div) => ({
				...div,
				teams:
					registrations.find((reg) => reg.divisionId === div.id)?.teams ?? [],
			})),
	});

	return data;
}

export type CartDivision = ReturnType<typeof useCartDivisions>[number];

export function useCart(checkout?: boolean) {
	const data = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	return data;
}

export function useMembershipPrice() {
	const { data } = useSuspenseQuery({
		...getSettingQueryOptions("membership-price"),
		select: (setting) => {
			if (!setting?.value) return null;
			const price = Number(setting.value);
			return Number.isNaN(price) || price <= 0 ? null : price;
		},
	});

	return data;
}

export function useMembershipsAvailable() {
	const price = useMembershipPrice();
	return price !== null;
}

export function useDefaultTournamentPrice() {
	const { data } = useSuspenseQuery({
		...getSettingQueryOptions("default-tournament-price"),
		select: (setting) => {
			if (!setting?.value) return null;
			const price = Number(setting.value);
			return Number.isNaN(price) || price <= 0 ? null : price;
		},
	});

	return data;
}

/**
 * Determines if registration is open for a tournament division.
 *
 * Registration is open if:
 * - A price is available (either division-specific or default tournament price)
 * - AND either no registration open time is set, or now >= registrationOpenAt/registrationOpenDate
 */
export function useIsRegistrationOpen({
	registrationPrice,
	registrationOpenAt,
}: {
	registrationPrice: number | null;
	registrationOpenAt: Date | null;
}) {
	const defaultPrice = useDefaultTournamentPrice();

	// Check if a price is available (division-specific or default)
	const hasPrice =
		(registrationPrice !== null && Number(registrationPrice) > 0) ||
		defaultPrice !== null;

	if (!hasPrice) {
		return false;
	}

	// If registrationOpenAt (timestamp) is set, use it for precise comparison
	if (registrationOpenAt) {
		return new Date() >= registrationOpenAt;
	}

	// If neither is set, registration is open
	return true;
}

export function useMembershipItems(checkout?: boolean) {
	const { memberships } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	const profiles = useCartProfiles(checkout);
	const membershipPrice = useMembershipPrice();

	if (membershipPrice === null) {
		return [];
	}

	return memberships
		.map((item) => ({
			profile: profiles.find((p) => p.id === item.profileId),
			tshirtSize: item.tshirtSize,
		}))
		.filter(({ profile }) => isDefined(profile))
		.map(({ profile, tshirtSize }) => ({
			type: "membership" as const,
			title: "Annual Membership",
			price: membershipPrice,
			profiles: [profile!],
			tshirtSize,
		}));
}

export function useTeamItems(checkout?: boolean) {
	const divisions = useCartDivisions(checkout);
	const profiles = useCartProfiles(checkout);
	const defaultPrice = useDefaultTournamentPrice();

	return divisions.flatMap((division) =>
		division.teams.map((team, index) => {
			const price = division.registrationPrice ?? defaultPrice ?? 0;
			const teamProfiles = team.profileIds
				.map((id) => profiles.find((p) => p.id === id))
				.filter(isDefined);

			return {
				type: "team" as const,
				title: `Team ${index + 1}`,
				division,
				price,
				profiles: teamProfiles,
			};
		}),
	);
}

export function useCartItems(checkout?: boolean) {
	const membershipItems = useMembershipItems(checkout);
	const teamItems = useTeamItems(checkout);

	return [...membershipItems, ...teamItems];
}

export function useCartTotal(checkout?: boolean) {
	const items = useCartItems(checkout);

	return sum(items.map(({ price }) => price));
}
