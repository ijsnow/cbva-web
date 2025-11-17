import chunk from "lodash/chunk";
import orderBy from "lodash/orderBy";

import type { PlayoffMatch, Pool, PoolTeam } from "@/db/schema";

const shapes = [
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

// export function draftPlayoffs(
// 	pools: (Pick<Pool, "id" | "name"> & {
// 		teams: Pick<PoolTeam, "id" | "finish">[];
// 	})[],
// 	count: number,
// ) {
// 	const teams = orderBy(
// 		pools.flatMap(({ name, teams }) =>
// 			teams.map((team) => ({
// 				id: team.id,
// 				finish: team.finish,
// 				pool: name,
// 			})),
// 		),
// 		["finish", "pool"],
// 		["asc", "asc"],
// 	).map((t, i) => ({ ...t, seed: i + 1 }));

// 	const trimmedCount = count - (count % pools.length);
// 	const roundedCount = trimmedCount - (trimmedCount % 2);

// 	const sidesOfBracket: {
// 		seeds: (Omit<PoolTeam, "poolId" | "teamId"> & { pool: string })[];
// 	}[] = [
// 		{
// 			seeds: [],
// 		},
// 		{
// 			seeds: [],
// 		},
// 	];

// 	// Find the appropriate shape based on the number of pools and teams
// 	const eligibleTeams = teams.slice(0, roundedCount);

// 	const shape = shapes.find((s) => {
// 		// Check if this shape matches the number of pools and total teams
// 		const totalSeeds = s.pools.reduce(
// 			(sum, pool) => sum + pool.seeds.length,
// 			0,
// 		);

// 		return (
// 			s.pools.length === pools.length && totalSeeds === eligibleTeams.length
// 		);
// 	});

// 	if (!shape) {
// 		throw new Error(
// 			`No bracket shape found for ${pools.length} pools with ${eligibleTeams.length} teams`,
// 		);
// 	}

// 	// The top qualifiers out of each pool advance to the playoffs.
// 	//
// 	// First and Second place teams should always be cross bracketed
// 	//
// 	// ● Example: 1st place team in pool #1 would go in the top bracket and 2nd  place team in pool #1 would go in the bottom bracket.
// 	//
// 	// 1
// 	// 16
// 	//
// 	// 9
// 	// 8
// 	//
// 	// 5
// 	// 12
// 	//
// 	// 13
// 	// 4
// 	//
// 	// ---
// 	//
// 	// 3
// 	// 14
// 	//
// 	// 11
// 	// 6
// 	//
// 	// 7
// 	// 10
// 	//
// 	// 15
// 	// 2

// 	// Assign teams to brackets based on the shape
// 	shape.pools.forEach((poolShape, poolIndex) => {
// 		poolShape.seeds.forEach((seed, positionIndex) => {
// 			const team = eligibleTeams.find((t) => t.seed === seed);

// 			if (team) {
// 				// Alternate bracket assignment based on position
// 				// First place teams go to top bracket, second place to bottom bracket, etc.
// 				const bracketIndex = positionIndex % 2;
// 				sidesOfBracket[bracketIndex].seeds.push(team);
// 			}
// 		});
// 	});

// 	return sidesOfBracket;
// }

export function draftPlayoffs(
	pools: (Pick<Pool, "id" | "name"> & {
		teams: Pick<PoolTeam, "id" | "finish">[];
	})[],
	count: number,
) {
	// const teams = orderBy(
	// 	pools.flatMap(({ name, teams }) =>
	// 		teams.map((team) => ({
	// 			id: team.id,
	// 			finish: team.finish,
	// 			pool: name,
	// 		})),
	// 	),
	// 	["finish", "pool"],
	// 	["asc", "asc"],
	// ).map((t, i) => ({ ...t, seed: i + 1 }));

	// const poolCount = pools.length;

	const trimmedCount = count - (count % pools.length);
	const roundedCount = trimmedCount - (trimmedCount % 2);

	// const seeds = seedPlayoffs(roundedCount, pools.length);

	// const matches: {
	// 	matchNumber: number;
	// 	aSeed: { poolId: number; seed: number };
	// 	bSeed: { poolId: number; seed: number };
	// }[] = [];

	// const bracketShape = shapes.find(({ pools }) => pools.length === poolCount);

	// console.log(bracketShape);

	// const matches: PlayoffMatch[] = [];

	return makeNode(roundedCount, 1);

	// while (node) {
	// 	node = node;

	// 	if (node.type === "game") {
	// 		console.log(node);
	// 		break;
	// 	}
	// }

	// console.log(JSON.stringify(node, null, 2));

	// for (const sideOfBracket of bracket) {
	// for (const match of bracket) {
	// 	console.log(match);
	// }
	// }

	// const sidesOfBracket: {
	// 	seeds: (Omit<PoolTeam, "poolId" | "teamId"> & { pool: string })[];
	// }[] = [
	// 	{
	// 		seeds: [],
	// 	},
	// 	{
	// 		seeds: [],
	// 	},
	// ];

	// return [];
}

export function seedPlayoffs(
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

export type PlayoffNode =
	| { type: "team"; seed: number }
	| { type: "game"; n: number; a: PlayoffNode; b: PlayoffNode };

function makeNode(size: number, n: number): PlayoffNode {
	const depth = Math.floor(Math.log2(n)) + 1;
	const dist = 2 ** depth - n;

	if (n + 1 > size) {
		return { type: "team", seed: dist };
	}

	const smaller = n + dist * 2 - 1;

	const bigger = 2 ** (depth + 1) - dist;

	const [even, odd] = smaller % 2 === 0 ? [smaller, bigger] : [bigger, smaller];

	return {
		type: "game",
		n,
		a: makeNode(size, odd),
		b: makeNode(size, even),
	};
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

export function createPlayoffBracket(
	pools: Pool[],
	teams: number,
	wildcards: number,
) {
	// - Seed teams
	// - Calculate number that would make it two full rounds: 12 teams -> 16, 17 -> 32
	// - Create list of matches, placing teams via snake draft filling teamA slots first then teamB, but flip a and b spots in second half of bracket
	// - Create the following rounds until the finals
	// - Advance teams in matches with no opponent
	//
	// 1
	// 16
	//
	// 9
	// 8
	//
	// 5
	// 12
	//
	// 13
	// 4
	//
	// ---
	//
	// 3
	// 14
	//
	// 11
	// 6
	//
	// 7
	// 10
	//
	// 15
	// 2
	// __
	//
	// 3.
}
