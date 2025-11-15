import { describe, expect, test } from "vitest";
import { draftPlayoffs } from "./playoffs";

describe("draftPlayoffs", () => {
	test("handles 5 pools with 12 teams", () => {
		const pools = "abcde";

		const testCase = {
			pools: Array.from({ length: 5 }).map((_, i) => ({
				id: i + 1,
				name: pools[i],
				teams: Array.from({ length: 4 }).map((_, j) => ({
					id: i * 4 + j + 1,
					finish: j + 1,
				})),
			})),
			count: 12,
		};

		// - Pool 0 (a): IDs 1, 2, 3, 4
		// - Pool 1 (b): IDs 5, 6, 7, 8
		// - Pool 2 (c): IDs 9, 10, 11, 12
		// - Pool 3 (d): IDs 13, 14, 15, 16
		// - Pool 4 (e): IDs 17, 18, 19, 20

		const result = draftPlayoffs(testCase.pools, testCase.count);

		// Verify we get two brackets
		expect(result).toHaveLength(2);
		expect(result[0].seeds).toBeDefined();
		expect(result[1].seeds).toBeDefined();

		// Verify cross-bracketing: first place teams in top bracket, second place in bottom bracket
		const topBracketSeeds = result[0].seeds.map((team) => team.seed);
		const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);

		// Should use shape 2 (5 pools, 12 teams)
		// Expected top bracket seeds: [1, 4, 5, 8, 9] (first place teams)
		// Expected bottom bracket seeds: [2, 3, 6, 7, 10] (second place teams)
		expect(topBracketSeeds).toEqual([1, 4, 5, 8, 9]);
		expect(bottomBracketSeeds).toEqual([2, 3, 6, 7, 10]);
	});

	test("handles 8 pools with 16 teams", () => {
		const pools = "abcdefgh";

		const testCase = {
			pools: Array.from({ length: 8 }).map((_, i) => ({
				id: i + 1,
				name: pools[i],
				teams: Array.from({ length: 4 }).map((_, j) => ({
					id: i * 4 + j + 1,
					finish: j + 1,
				})),
			})),
			count: 16,
		};

		const result = draftPlayoffs(testCase.pools, testCase.count);

		// Verify we get two brackets
		expect(result).toHaveLength(2);

		// Should use shape 0 (8 pools, 16 teams)
		// Expected top bracket seeds: [1, 4, 5, 8, 9, 12, 13, 16] (first place teams)
		// Expected bottom bracket seeds: [2, 3, 6, 7, 10, 11, 14, 15] (second place teams)
		const topBracketSeeds = result[0].seeds.map((team) => team.seed);
		const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);

		expect(topBracketSeeds).toEqual([1, 4, 5, 8, 9, 12, 13, 16]);
		expect(bottomBracketSeeds).toEqual([2, 3, 6, 7, 10, 11, 14, 15]);
	});

	test("handles 3 pools with 6 teams", () => {
		const pools = "abc";

		const testCase = {
			pools: Array.from({ length: 3 }).map((_, i) => ({
				id: i + 1,
				name: pools[i],
				teams: Array.from({ length: 4 }).map((_, j) => ({
					id: i * 4 + j + 1,
					finish: j + 1,
				})),
			})),
			count: 6,
		};

		const result = draftPlayoffs(testCase.pools, testCase.count);

		// Verify we get two brackets
		expect(result).toHaveLength(2);

		// Should use shape 5 (3 pools, 6 teams)
		// Expected top bracket seeds: [1, 6] (first place teams)
		// Expected bottom bracket seeds: [2, 5, 4] (second place teams)
		const topBracketSeeds = result[0].seeds.map((team) => team.seed);
		const bottomBracketSeeds = result[1].seeds.map((team) => team.seed);

		expect(topBracketSeeds).toEqual([1, 6]);
		expect(bottomBracketSeeds).toEqual([2, 5, 4]);
	});
});
