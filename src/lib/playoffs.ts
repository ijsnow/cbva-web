import chunk from "lodash-es/chunk";
import range from "lodash-es/range";

import { snakeDraft } from "./snake-draft";

export function getFinishForRound(round: number, totalRounds: number) {
	return 2 ** (totalRounds - round + 1);
}

const playoffSeedOrders = [
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|
	// | 1      | 1       |                  | 1    |                   | 15   |
	// | 2      | 2       |                  | 2    |                   | 13   |
	// | 3      | 3       |                  | 3    |                   | 12   |
	// | 4      | 4       |                  | 4    |                   | 11   |
	// | 5      | 5       |                  | 5    |                   | 10   |
	// | 6      | 6       |                  | 6    |                   | 16   |
	// | 7      | 7       |                  | 7    |                   | 9    |
	// | 8      | 8       |                  | 8    |                   | 14   |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 15],
			},
			{
				id: 2,
				seeds: [2, 13],
			},
			{
				id: 3,
				seeds: [3, 12],
			},
			{
				id: 4,
				seeds: [4, 11],
			},
			{
				id: 5,
				seeds: [5, 10],
			},
			{
				id: 6,
				seeds: [6, 16],
			},
			{
				id: 7,
				seeds: [7, 9],
			},
			{
				id: 8,
				seeds: [8, 14],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|
	// | 1      | 1       |                  | 1    |                   | 10   |
	// | 2      | 2       |                  | 2    |                   | 13   |
	// | 3      | 3       |                  | 3    |                   | 12   |
	// | 4      | 4       |                  | 4    |                   | 14   |
	// | 5      | 5       |                  | 5    |                   | 11   |
	// | 6      | 6       |                  | 6    |                   | 8    |
	// | 7      | 7       |                  | 7    |                   | 9    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 10],
			},
			{
				id: 2,
				seeds: [2, 13],
			},
			{
				id: 3,
				seeds: [3, 12],
			},
			{
				id: 4,
				seeds: [4, 14],
			},
			{
				id: 5,
				seeds: [5, 11],
			},
			{
				id: 6,
				seeds: [6, 8],
			},
			{
				id: 7,
				seeds: [7, 9],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|
	// | 1      | 1       |                  | 1    |                   | 11   |
	// | 2      | 2       |                  | 2    |                   | 12   |
	// | 3      | 3       |                  | 3    |                   | 9    |
	// | 4      | 4       |                  | 4    |                   | 10   |
	// | 5      | 5       |                  | 5    |                   | 7    |
	// | 6      | 6       |                  | 6    |                   | 8    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 11],
			},
			{
				id: 2,
				seeds: [2, 12],
			},
			{
				id: 3,
				seeds: [3, 9],
			},
			{
				id: 4,
				seeds: [4, 10],
			},
			{
				id: 5,
				seeds: [5, 7],
			},
			{
				id: 6,
				seeds: [6, 8],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|
	// | 1      | 1       |                  | 1    |                   | 10   |
	// | 2      | 2       |                  | 2    |                   | 9    |
	// | 3      | 3       |                  | 3    |                   | 8    |
	// | 4      | 4       |                  | 4    |                   | 7    |
	// | 5      | 5       |                  | 5    |                   | 6    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 10],
			},
			{
				id: 2,
				seeds: [2, 9],
			},
			{
				id: 3,
				seeds: [3, 8],
			},
			{
				id: 4,
				seeds: [4, 7],
			},
			{
				id: 5,
				seeds: [5, 6],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed | Third Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|------------------|------|
	// | 1      | 1       |                  | 1    |                   | 6    |                  | 12   |
	// | 2      | 2       |                  | 2    |                   | 5    |                  | 11   |
	// | 3      | 3       |                  | 3    |                   | 8    |                  | 10   |
	// | 4      | 4       |                  | 4    |                   | 7    |                  | 9    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 6, 12],
			},
			{
				id: 2,
				seeds: [2, 5, 11],
			},
			{
				id: 3,
				seeds: [3, 8, 10],
			},
			{
				id: 4,
				seeds: [4, 7, 9],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|
	// | 1      | 1       |                  | 1    |                   | 6    |
	// | 2      | 2       |                  | 2    |                   | 5    |
	// | 3      | 3       |                  | 3    |                   | 4    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 6],
			},
			{
				id: 2,
				seeds: [2, 5],
			},
			{
				id: 3,
				seeds: [3, 4],
			},
		],
	},
	// | Pool # | Court # | First Place Team | Seed | Second Place Team | Seed | Third Place Team | Seed |
	// |--------|---------|------------------|------|-------------------|------|------------------|------|
	// | 1      | 1       |                  | 1    |                   | 3    |                  | 5    |
	// | 2      | 2       |                  | 2    |                   | 4    |                  | 6    |
	{
		pools: [
			{
				id: 1,
				seeds: [1, 3, 5],
			},
			{
				id: 2,
				seeds: [2, 4, 6],
			},
		],
	},
];

const SEED_ORDERS: { [key: number]: { pool: number; seed: number }[] } = {
	2: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 0, seed: 2 },
		{ pool: 1, seed: 2 },
		{ pool: 0, seed: 3 },
		{ pool: 1, seed: 3 },
	],
	3: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 2, seed: 1 },
		{ pool: 2, seed: 2 },
		{ pool: 1, seed: 2 },
		{ pool: 0, seed: 2 },
	],
	4: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 2, seed: 1 },
		{ pool: 3, seed: 1 },
		{ pool: 1, seed: 2 },
		{ pool: 0, seed: 2 },
		{ pool: 3, seed: 2 },
		{ pool: 2, seed: 2 },
		{ pool: 3, seed: 3 },
		{ pool: 2, seed: 3 },
		{ pool: 1, seed: 3 },
		{ pool: 0, seed: 3 },
	],
	5: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 2, seed: 1 },
		{ pool: 3, seed: 1 },
		{ pool: 4, seed: 1 },
		{ pool: 4, seed: 2 },
		{ pool: 3, seed: 2 },
		{ pool: 2, seed: 2 },
		{ pool: 1, seed: 2 },
		{ pool: 0, seed: 2 },
		{ pool: 0, seed: 3 },
		{ pool: 1, seed: 3 },
		{ pool: 2, seed: 3 },
		{ pool: 3, seed: 3 },
		{ pool: 4, seed: 3 },
	],
	6: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 2, seed: 1 },
		{ pool: 3, seed: 1 },
		{ pool: 4, seed: 1 },
		{ pool: 5, seed: 1 },
		{ pool: 5, seed: 2 },
		{ pool: 4, seed: 2 },
		{ pool: 3, seed: 2 },
		{ pool: 2, seed: 2 },
		{ pool: 1, seed: 2 },
		{ pool: 0, seed: 2 },
	],
	7: [
		{ pool: 0, seed: 1 },
		{ pool: 1, seed: 1 },
		{ pool: 2, seed: 1 },
		{ pool: 3, seed: 1 },
		{ pool: 4, seed: 1 },
		{ pool: 5, seed: 1 },
		{ pool: 6, seed: 1 },
		{ pool: 5, seed: 2 },
		{ pool: 6, seed: 2 },
		{ pool: 0, seed: 2 },
		{ pool: 4, seed: 2 },
		{ pool: 2, seed: 2 },
		{ pool: 1, seed: 2 },
		{ pool: 3, seed: 2 },
	],
};

export function seedPlayoffs(
	size: number,
	poolCount: number,
): { pool: number; seed: number }[] {
	const seedOrders = SEED_ORDERS[poolCount];

	if (!seedOrders) {
		return fancySnakeDraft(size, poolCount);
	}

	return seedOrders;
}

export function fancySnakeDraft(
	size: number,
	poolCount: number,
): { pool: number; seed: number }[] {
	// Determine how many teams per pool make playoffs
	const teamsPerPool = Math.floor(size / poolCount);

	return Array.from({ length: teamsPerPool }).flatMap((_, i) => {
		let pools: number[] = Array.from({ length: poolCount }).map((_, i) => i);

		if (i % 2 === 1) {
			pools.reverse();
		}

		if (poolCount % 2 === 0 && i > 0) {
			if (i % 2 === 1) {
				pools = chunk(pools, 2).flatMap(([a, b]) => [b, a]);
			}

			if ((i === 3 || i % 2 === 0) && poolCount % 4 === 0) {
				pools = chunk(pools, 4).flatMap(([a, b, c, d]) => [d, c, b, a]);
			}
		}

		return pools.map((p) => ({ pool: p, seed: i + 1 }));
	});
}

export function snakePlayoffs(
	size: number,
	pools: number[],
): { poolId: number; seed: number }[] {
	const pc = pools.length;
	const result: { poolId: number; seed: number }[] = [];

	for (let i = 0; i < size / pc; i++) {
		const currentPools = [...pools]; // Create a copy

		// Reverse order for odd rounds (snake pattern)
		if (i % 2 === 1) {
			currentPools.reverse();
		}

		// Additional adjustments for even number of pools
		if (pc % 2 === 0 && i > 0) {
			if (i % 2 === 1) {
				// Reverse pairs of pools
				for (let j = 0; j < currentPools.length; j += 2) {
					if (j + 1 < currentPools.length) {
						[currentPools[j], currentPools[j + 1]] = [
							currentPools[j + 1],
							currentPools[j],
						];
					}
				}
			}

			// Quad swapping for certain rounds
			if ((i === 3 || i % 2 === 0) && pc % 4 === 0) {
				// Reverse groups of 4 pools
				for (let j = 0; j < currentPools.length; j += 4) {
					if (j + 3 < currentPools.length) {
						[currentPools[j], currentPools[j + 3]] = [
							currentPools[j + 3],
							currentPools[j],
						];
						[currentPools[j + 1], currentPools[j + 2]] = [
							currentPools[j + 2],
							currentPools[j + 1],
						];
					}
				}
			}
		}

		// Add teams from this round to result
		for (const pool of currentPools) {
			result.push({ poolId: pool, seed: i + 1 });
		}
	}

	return result;
}

export function recursiveSnakeDraft(seeds: number[]): number[][] {
	if (seeds.length === 2) {
		// Base case: just return the pair with even seed in second slot
		const [a, b] = seeds;

		return [a % 2 === 0 ? [b, a] : [a, b]];
	}

	// Perform snake draft to split into two chunks
	const [chunk1, chunk2] = snakeDraft(seeds, 2);

	// Recursively process each chunk
	const result1 = recursiveSnakeDraft(chunk1);
	const result2 = recursiveSnakeDraft(chunk2);

	result2.reverse();

	// Combine results
	return [...result1, ...result2];
}

export type PlayoffMatchNode = {
	aSeed?: number | null;
	bSeed?: number | null;
	aFrom?: number | null;
	bFrom?: number | null;
};

export function draftPlayoffs(size: number) {
	const seedCount = 2 ** Math.ceil(Math.log2(size));

	const firstRound = recursiveSnakeDraft(range(1, seedCount + 1)) as [
		number,
		number,
	][];

	const rounds: (PlayoffMatchNode | null)[][] = [
		firstRound.map(([aSeed, bSeed]) => ({ aSeed, bSeed })),
	];

	for (let i = 1; i < Math.log2(seedCount); i++) {
		rounds[i] = [];

		const prev = rounds[i - 1];

		for (let j = 0; j < prev.length; j += 2) {
			const next: PlayoffMatchNode = {};

			const aMatch = rounds[i - 1][j];

			if (
				aMatch?.aSeed &&
				aMatch.bSeed &&
				(aMatch.aSeed > size || aMatch.bSeed > size)
			) {
				next.aSeed = aMatch.aSeed < size ? aMatch.aSeed : aMatch.bSeed;

				rounds[i - 1][j] = null;
			} else {
				next.aFrom = j;
			}

			const bMatch = rounds[i - 1][j + 1];

			if (
				bMatch?.aSeed &&
				bMatch.bSeed &&
				(bMatch.aSeed > size || bMatch.bSeed > size)
			) {
				next.bSeed = bMatch.aSeed < size ? bMatch.aSeed : bMatch.bSeed;

				rounds[i - 1][j + 1] = null;
			} else {
				next.bFrom = j + 1;
			}

			rounds[i].push(next);
		}
	}

	return rounds;
}
