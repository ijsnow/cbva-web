import { cartSchema } from "@/functions/payments/checkout";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { getSettingQueryOptions } from "@/functions/settings/get-setting";
import { getTournamentDivisionsQueryOptions } from "@/functions/tournament-divisions/get-tournament-divisions";
import { isDefined } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { sum, uniqBy } from "lodash-es";
import z from "zod";

export const divisionRegistrationSchema = z.object({
	divisionId: z.number(),
	profileIds: z.array(z.number()),
});

export type DivisionRegistration = z.infer<typeof divisionRegistrationSchema>;

export const registrationPageSchema = cartSchema.extend({
	profiles: z.array(z.number()).default([]),
	divisions: z.array(divisionRegistrationSchema).default([]),
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

export function useCartDivisionRegistrations(checkout?: boolean) {
	const { divisions } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	return divisions;
}

export function useCartDivisions(checkout?: boolean) {
	const registrations = useCartDivisionRegistrations(checkout);
	const divisionIds = registrations.map((r) => r.divisionId);

	const { data } = useSuspenseQuery(
		getTournamentDivisionsQueryOptions(divisionIds),
	);

	return data;
}

export function useCartMembershipItems() {
	const { memberships } = useSearch({
		from: "/account/registrations/",
	});

	const profiles = useCartProfiles();
	const membershipPrice = useMembershipPrice();

	if (membershipPrice === null) {
		return [];
	}

	return memberships
		.map((id) => profiles.find((p) => p.id === id))
		.filter(isDefined)
		.map((profile) => ({
			type: "membership" as const,
			title: "Annual Membership",
			price: membershipPrice,
			profile,
		}));
}

export function useCartDivisionItems(checkout?: boolean) {
	const registrations = useCartDivisionRegistrations(checkout);
	const divisions = useCartDivisions(checkout);
	const profiles = useCartProfiles(checkout);
	const defaultPrice = useDefaultTournamentPrice();

	return registrations.map((registration) => {
		const division = divisions.find((d) => d.id === registration.divisionId);
		const registeredProfiles = registration.profileIds
			.map((id) => profiles.find((p) => p.id === id))
			.filter(isDefined);

		return {
			type: "tournament" as const,
			title: division
				? `${division.tournament.name || division.tournament.venue.name}`
				: "Unknown Tournament",
			subtitle: division
				? `${division.division.name} - ${division.gender}`
				: "",
			price: division?.registrationPrice ?? defaultPrice ?? 0,
			division,
			registration,
			profiles: registeredProfiles,
		};
	});
}

export function useCartItems() {
	const membershipItems = useCartMembershipItems();

	return membershipItems;
}

export function useCartTotal(checkout?: boolean) {
	const { memberships } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	const profiles = useCartProfiles(checkout);
	const membershipPrice = useMembershipPrice();
	const divisionItems = useCartDivisionItems(checkout);

	const membershipTotal =
		membershipPrice !== null
			? sum(
					memberships
						.map((id) => profiles.find((p) => p.id === id))
						.filter(isDefined)
						.map(() => membershipPrice),
				)
			: 0;

	// Only count divisions that have players registered
	const validDivisionItems = divisionItems.filter(
		(item) => item.profiles.length > 0,
	);
	const divisionTotal = sum(validDivisionItems.map((item) => item.price));

	return membershipTotal + divisionTotal;
}
