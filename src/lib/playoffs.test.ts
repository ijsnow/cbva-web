import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { draftPlayoffs, iterativeSnakeDraft, seedPlayoffs } from "./playoffs";

// describe("seedPlayoffs", () => {
// 	test("can seed varying pool sizes and team counts", () => {
// 		const cases = [
// 			{
// 				teams: 6,
// 				pools: 2,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 0, seed: 2 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 0, seed: 3 },
// 					{ pool: 1, seed: 3 },
// 				],
// 			},
// 			{
// 				teams: 6,
// 				pools: 3,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 2, seed: 1 },
// 					{ pool: 2, seed: 2 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 0, seed: 2 },
// 				],
// 			},
// 			{
// 				teams: 12,
// 				pools: 4,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 2, seed: 1 },
// 					{ pool: 3, seed: 1 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 0, seed: 2 },
// 					{ pool: 3, seed: 2 },
// 					{ pool: 2, seed: 2 },
// 					{ pool: 3, seed: 3 },
// 					{ pool: 2, seed: 3 },
// 					{ pool: 1, seed: 3 },
// 					{ pool: 0, seed: 3 },
// 				],
// 			},
// 			{
// 				teams: 12,
// 				pools: 5,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 2, seed: 1 },
// 					{ pool: 3, seed: 1 },
// 					{ pool: 4, seed: 1 },
// 					{ pool: 4, seed: 2 },
// 					{ pool: 3, seed: 2 },
// 					{ pool: 2, seed: 2 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 0, seed: 2 },
// 					{ pool: 0, seed: 3 },
// 					{ pool: 1, seed: 3 },
// 					{ pool: 2, seed: 3 },
// 					{ pool: 3, seed: 3 },
// 					{ pool: 4, seed: 3 },
// 				],
// 			},
// 			{
// 				teams: 12,
// 				pools: 6,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 2, seed: 1 },
// 					{ pool: 3, seed: 1 },
// 					{ pool: 4, seed: 1 },
// 					{ pool: 5, seed: 1 },
// 					{ pool: 5, seed: 2 },
// 					{ pool: 4, seed: 2 },
// 					{ pool: 3, seed: 2 },
// 					{ pool: 2, seed: 2 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 0, seed: 2 },
// 				],
// 			},
// 			{
// 				teams: 14,
// 				pools: 7,
// 				want: [
// 					{ pool: 0, seed: 1 },
// 					{ pool: 1, seed: 1 },
// 					{ pool: 2, seed: 1 },
// 					{ pool: 3, seed: 1 },
// 					{ pool: 4, seed: 1 },
// 					{ pool: 5, seed: 1 },
// 					{ pool: 6, seed: 1 },
// 					{ pool: 5, seed: 2 },
// 					{ pool: 6, seed: 2 },
// 					{ pool: 0, seed: 2 },
// 					{ pool: 4, seed: 2 },
// 					{ pool: 2, seed: 2 },
// 					{ pool: 1, seed: 2 },
// 					{ pool: 3, seed: 2 },
// 				],
// 			},
// 		];

// 		for (const { teams, pools, want } of cases) {
// 			const got = seedPlayoffs(teams, pools);

// 			expect(got, `teams=${teams}; pools=${pools}`).toStrictEqual(want);
// 		}
// 	});
// });

// describe("draftPlayoffs", () => {
// 	test("draft playoffs", () => {
// 		const pools = "abcde";

// 		const testCases = [
// 			{
// 				pools: Array.from({ length: 5 }).map((_, i) => ({
// 					id: i + 1,
// 					name: pools[i],
// 					teams: Array.from({ length: 4 }).map((_, j) => ({
// 						id: i * 4 + j + 1,
// 						finish: j + 1,
// 					})),
// 				})),
// 				count: 16,
// 			},
// 		];

// 		for (const { pools, count } of testCases) {
// 			const got = draftPlayoffs(pools, count);

// 			expect(got).toStrictEqual(null);
// 		}
// 	});

// 	// 	test("handles 5 pools with 12 teams", () => {
// 	// 		const pools = "abcde";
// 	// 		const testCase = {
// 	// 			pools: Array.from({ length: 5 }).map((_, i) => ({
// 	// 				id: i + 1,
// 	// 				name: pools[i],
// 	// 				teams: Array.from({ length: 4 }).map((_, j) => ({
// 	// 					id: i * 4 + j + 1,
// 	// 					finish: j + 1,
// 	// 				})),
// 	// 			})),
// 	// 			count: 16,
// 	// 		};
// 	// 		// - Pool 0 (a): IDs 1, 2, 3, 4
// 	// 		// - Pool 1 (b): IDs 5, 6, 7, 8
// 	// 		// - Pool 2 (c): IDs 9, 10, 11, 12
// 	// 		// - Pool 3 (d): IDs 13, 14, 15, 16
// 	// 		// - Pool 4 (e): IDs 17, 18, 19, 20
// 	// 		const result = draftPlayoffs(testCase.pools, testCase.count);
// 	// 		console.log(result);
// 	// 		// // Verify we get two brackets
// 	// 		// expect(result).toHaveLength(2);
// 	// 		// expect(result[0].seeds).toBeDefined();
// 	// 		// expect(result[1].seeds).toBeDefined();
// 	// 		// // Verify cross-bracketing: first place teams in top bracket, second place in bottom bracket
// 	// 		// const topBracketSeeds = result[0].seeds.map((team) => team.seed);
// 	// 		// const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);
// 	// 		// // Should use shape 2 (5 pools, 12 teams)
// 	// 		// // Expected top bracket seeds: [1, 4, 5, 8, 9] (first place teams)
// 	// 		// // Expected bottom bracket seeds: [2, 3, 6, 7, 10] (second place teams)
// 	// 		// expect(topBracketSeeds).toEqual([1, 4, 5, 8, 9]);
// 	// 		// expect(bottomBracketSeeds).toEqual([2, 3, 6, 7, 10]);
// 	// 	});
// 	// 	// test("handles 8 pools with 16 teams", () => {
// 	// 	// 	const pools = "abcdefgh";
// 	// 	// 	const testCase = {
// 	// 	// 		pools: Array.from({ length: 8 }).map((_, i) => ({
// 	// 	// 			id: i + 1,
// 	// 	// 			name: pools[i],
// 	// 	// 			teams: Array.from({ length: 4 }).map((_, j) => ({
// 	// 	// 				id: i * 4 + j + 1,
// 	// 	// 				finish: j + 1,
// 	// 	// 			})),
// 	// 	// 		})),
// 	// 	// 		count: 16,
// 	// 	// 	};
// 	// 	// 	const result = draftPlayoffs(testCase.pools, testCase.count);
// 	// 	// 	// Verify we get two brackets
// 	// 	// 	expect(result).toHaveLength(2);
// 	// 	// 	// Should use shape 0 (8 pools, 16 teams)
// 	// 	// 	// Expected top bracket seeds: [1, 4, 5, 8, 9, 12, 13, 16] (first place teams)
// 	// 	// 	// Expected bottom bracket seeds: [2, 3, 6, 7, 10, 11, 14, 15] (second place teams)
// 	// 	// 	const topBracketSeeds = result[0].seeds.map((team) => team.seed);
// 	// 	// 	const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);
// 	// 	// 	expect(topBracketSeeds).toEqual([1, 4, 5, 8, 9, 12, 13, 16]);
// 	// 	// 	expect(bottomBracketSeeds).toEqual([2, 3, 6, 7, 10, 11, 14, 15]);
// 	// 	// });
// 	// 	// test("handles 3 pools with 6 teams", () => {
// 	// 	// 	const pools = "abc";
// 	// 	// 	const testCase = {
// 	// 	// 		pools: Array.from({ length: 3 }).map((_, i) => ({
// 	// 	// 			id: i + 1,
// 	// 	// 			name: pools[i],
// 	// 	// 			teams: Array.from({ length: 4 }).map((_, j) => ({
// 	// 	// 				id: i * 4 + j + 1,
// 	// 	// 				finish: j + 1,
// 	// 	// 			})),
// 	// 	// 		})),
// 	// 	// 		count: 6,
// 	// 	// 	};
// 	// 	// 	const result = draftPlayoffs(testCase.pools, testCase.count);
// 	// 	// 	// Verify we get two brackets
// 	// 	// 	expect(result).toHaveLength(2);
// 	// 	// 	// Should use shape 5 (3 pools, 6 teams)
// 	// 	// 	// Expected top bracket seeds: [1, 6] (first place teams)
// 	// 	// 	// Expected bottom bracket seeds: [2, 5, 4] (second place teams)
// 	// 	// 	const topBracketSeeds = result[0].seeds.map((team) => team.seed);
// 	// 	// 	const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);
// 	// 	// 	expect(topBracketSeeds).toEqual([1, 6]);
// 	// 	// 	expect(bottomBracketSeeds).toEqual([2, 5, 4]);
// 	// 	// });
// });

// describe("buildFirstRound", () => {
// 	test("round of 16", () => {
// 		expect(buildFirstRound(16)).toStrictEqual([
// 			// -- //
// 			// 1, 4, 5, 8, 9
// 			[1, 16],
// 			[9, 8],
// 			[5, 12],
// 			[13, 4],
// 			// -- //
// 			// 2, 3, 6, 7, 10, 11, 14, 15
// 			[3, 14],
// 			[11, 6],
// 			[7, 10],
// 			[15, 2],
// 			// -- //
// 		]);
// 	});
// });

describe("iterativeSnakeDraft", () => {
	const cases = [
		{
			size: 4,
			want: [
				[1, 4],
				[3, 2],
			],
		},
		{
			size: 8,
			want: [
				[1, 8],
				[5, 4],
				// ---
				[3, 6],
				[7, 2],
			],
		},
		// {
		// 	size: 16,
		// 	want: [
		// 		// -- //
		// 		[1, 16],
		// 		[9, 8],
		// 		[5, 12],
		// 		[13, 4],
		// 		// -- //
		// 		[3, 14],
		// 		[11, 6],
		// 		[7, 10],
		// 		[15, 2],
		// 		// -- //
		// 	],
		// },
	];

	for (const { size, want } of cases) {
		test(`round of ${size}`, () => {
			const got = iterativeSnakeDraft(range(1, size + 1));

			console.log("got", got);

			expect(got).toStrictEqual(want);
		});
	}
});
