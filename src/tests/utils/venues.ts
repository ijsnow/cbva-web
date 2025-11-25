import { faker } from "@faker-js/faker/locale/en";
import { eq } from "drizzle-orm";
import { range } from "lodash";
import {
	type CreateVenue,
	type Database,
	type Venue,
	venues,
} from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";

function createVenueValues(overrides: Partial<Venue> = {}): CreateVenue {
	return {
		slug: faker.string.ulid(),
		name: `${faker.word.noun()} Beach`,
		city: faker.location.city(),
		description: {} as LexicalState,
		directions: {} as LexicalState,
		mapUrl: "",
		status: "active",
		...overrides,
	};
}

export async function createVenues(
	db: Database,
	config: number | Partial<Venue>[],
) {
	const values = Array.isArray(config)
		? config.map(createVenueValues)
		: range(0, config).map(() => createVenueValues());

	return await db.insert(venues).values(values).returning({
		id: venues.id,
	});
}

export async function getDefaultVenue(
	db: Database,
): Promise<Pick<Venue, "id">> {
	const [venue] = await db
		.select({
			id: venues.id,
		})
		.from(venues)
		.where(eq(venues.slug, "dv"));

	return venue;
}
