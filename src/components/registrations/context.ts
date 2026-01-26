import { cartSchema } from "@/functions/payments/checkout";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { getSettingQueryOptions } from "@/functions/settings/get-setting";
import { isDefined } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { sum, uniqBy } from "lodash-es";
import z from "zod";

export const registrationPageSchema = cartSchema.extend({
	profiles: z.array(z.number()).default([]),
	divisions: z.array(z.number()).default([]),
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

export function useCartItems() {
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
			title: "Annual Membership",
			price: membershipPrice,
			profile,
		}));
}

export function useCartTotal(checkout?: boolean) {
	const { memberships } = useSearch({
		from: checkout
			? "/account/registrations/checkout"
			: "/account/registrations/",
	});

	const profiles = useCartProfiles(checkout);
	const membershipPrice = useMembershipPrice();

	if (membershipPrice === null) {
		return null;
	}

	return sum(
		memberships
			.map((id) => profiles.find((p) => p.id === id))
			.filter(isDefined)
			.map(() => membershipPrice),
	);
}
