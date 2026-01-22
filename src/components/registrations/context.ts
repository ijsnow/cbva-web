import { cartSchema } from "@/functions/payments/checkout";
import { getProfilesQueryOptions } from "@/functions/profiles/get-profiles";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { isDefined } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { sum, uniqBy } from "lodash-es";
import z from "zod";

export const registrationPageSchema = cartSchema.extend({
	profiles: z.array(z.number()).default([]),
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

export function useCartItems() {
	const { memberships } = useSearch({
		from: "/account/registrations/",
	});

	const profiles = useCartProfiles();

	return memberships
		.map((id) => profiles.find((p) => p.id === id))
		.filter(isDefined)
		.map((profile) => ({
			title: "Annual Membership",
			price: 100,
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

	return sum(
		memberships
			.map((id) => profiles.find((p) => p.id === id))
			.filter(isDefined)
			.map(() => 100),
	);
}
