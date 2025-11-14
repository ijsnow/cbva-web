import orderBy from "lodash/orderBy";
import type { Pool, PoolTeam } from "@/db/schema";

export function snake(spots: number, buckets: number): number[][] {
	const result: number[][] = Array.from({ length: buckets }, () => []);
	const rounds = Math.ceil(spots / buckets);

	let currentSpot = 1;

	for (let round = 0; round < rounds; round++) {
		if (round % 2 === 0) {
			for (let bucket = 0; bucket < buckets; bucket++) {
				if (currentSpot <= spots) {
					result[bucket].push(currentSpot);
					currentSpot++;
				}
			}
		} else {
			for (let bucket = buckets - 1; bucket >= 0; bucket--) {
				if (currentSpot <= spots) {
					result[bucket].push(currentSpot);
					currentSpot++;
				}
			}
		}
	}

	return result;
}

export function snake2<P extends { id: number }, B extends { id: number }>(
	participants: P[],
	buckets: B[],
): (B & { participants: P[] })[] {
	const result: (B & { participants: P[] })[] = buckets.map((bucket) => ({
		...bucket,
		participants: [],
	}));

	const rounds = Math.ceil(participants.length / buckets.length);
	let currentIndex = 0;

	for (let round = 0; round < rounds; round++) {
		if (round % 2 === 0) {
			for (let bucket = 0; bucket < buckets.length; bucket++) {
				if (currentIndex < participants.length) {
					result[bucket].participants.push(participants[currentIndex]);
					currentIndex++;
				}
			}
		} else {
			for (let bucket = buckets.length - 1; bucket >= 0; bucket--) {
				if (currentIndex < participants.length) {
					result[bucket].participants.push(participants[currentIndex]);
					currentIndex++;
				}
			}
		}
	}

	return result;
}

export function snakePlayoffs(
	pools: (Pick<Pool, "id" | "name"> & {
		teams: Pick<PoolTeam, "id" | "finish">[];
	})[],
	count: number,
) {
	const teams = orderBy(
		pools.flatMap(({ name, teams }) =>
			teams.map((team) => ({
				id: team.id,
				finish: team.finish,
				pool: name,
			})),
		),
		["finish", "pool"],
		["asc", "asc"],
	);

	const trimmedCount = count - (count % pools.length);
	const roundedCount = trimmedCount - (trimmedCount % 2);

	const draft = snake2(teams.slice(0, roundedCount), [
		{
			id: 0,
		},
		{
			id: 1,
		},
	]);

	return draft;
}
