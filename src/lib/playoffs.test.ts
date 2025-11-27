import { range } from "lodash-es";
import { describe, expect, test } from "vitest";
import { draftPlayoffs, recursiveSnakeDraft, seedPlayoffs } from "./playoffs";

describe("seedPlayoffs", () => {
	const cases = [
		{
			teams: 6,
			pools: 2,
			want: [
				{ pool: 0, seed: 1 },
				{ pool: 1, seed: 1 },
				{ pool: 0, seed: 2 },
				{ pool: 1, seed: 2 },
				{ pool: 0, seed: 3 },
				{ pool: 1, seed: 3 },
			],
		},
		{
			teams: 6,
			pools: 3,
			want: [
				{ pool: 0, seed: 1 },
				{ pool: 1, seed: 1 },
				{ pool: 2, seed: 1 },
				{ pool: 2, seed: 2 },
				{ pool: 1, seed: 2 },
				{ pool: 0, seed: 2 },
			],
		},
		{
			teams: 12,
			pools: 4,
			want: [
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
		},
		{
			teams: 12,
			pools: 5,
			want: [
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
		},
		{
			teams: 12,
			pools: 6,
			want: [
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
		},
		{
			teams: 14,
			pools: 7,
			want: [
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
		},
	];

	for (const { teams, pools, want } of cases) {
		test(`teams=${teams}; pools=${pools}`, () => {
			const got = seedPlayoffs(teams, pools);

			expect(got, `teams=${teams}; pools=${pools}`).toStrictEqual(want);
		});
	}
});

describe("recursiveSnakeDraft", () => {
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
		{
			size: 16,
			want: [
				// -- //
				[1, 16],
				[9, 8],
				[5, 12],
				[13, 4],
				// -- //
				[3, 14],
				[11, 6],
				[7, 10],
				[15, 2],
				// -- //
			],
		},
		{
			size: 32,
			want: [
				// -- //
				[1, 32],
				[17, 16],
				[9, 24],
				[25, 8],
				// -- //
				[5, 28],
				[21, 12],
				[13, 20],
				[29, 4],
				// -- //
				// -- //
				[3, 30],
				[19, 14],
				[11, 22],
				[27, 6],
				// -- //
				[7, 26],
				[23, 10],
				[15, 18],
				[31, 2],
				// -- //
			],
		},
		{
			size: 64,
			want: [
				[1, 64],
				[33, 32],
				[17, 48],
				[49, 16],
				// --
				[9, 56],
				[41, 24],
				[25, 40],
				[57, 8],
				// --
				// --
				[5, 60],
				[37, 28],
				[21, 44],
				[53, 12],
				// --
				[13, 52],
				[45, 20],
				[29, 36],
				[61, 4],
				// --
				// --
				// --
				[3, 62],
				[35, 30],
				[19, 46],
				[51, 14],
				// --
				[11, 54],
				[43, 22],
				[27, 38],
				[59, 6],
				// --
				// --
				[7, 58],
				[39, 26],
				[23, 42],
				[55, 10],
				// --
				[15, 50],
				[47, 18],
				[31, 34],
				[63, 2],
			],
		},
	];

	for (const { size, want } of cases) {
		test(`round of ${size}`, () => {
			const got = recursiveSnakeDraft(range(1, size + 1));

			if (size === 64) {
				console.log(JSON.stringify(got, null, 2));
			}

			expect(got).toStrictEqual(want);
		});
	}
});

describe("draftPlayoffs", () => {
	const cases = [
		{
			size: 4,
			want: [
				[
					{ aSeed: 1, bSeed: 4 },
					{ aSeed: 3, bSeed: 2 },
				],
				[{ aFrom: 0, bFrom: 1 }],
			],
		},
		{
			size: 8,
			want: [
				[
					{ aSeed: 1, bSeed: 8 },
					{ aSeed: 5, bSeed: 4 },
					{ aSeed: 3, bSeed: 6 },
					{ aSeed: 7, bSeed: 2 },
				],
				[
					{ aFrom: 0, bFrom: 1 },
					{ aFrom: 2, bFrom: 3 },
				],
				[{ aFrom: 0, bFrom: 1 }],
			],
		},
		{
			size: 16,
			want: [
				[
					{ aSeed: 1, bSeed: 16 },
					{ aSeed: 9, bSeed: 8 },
					{ aSeed: 5, bSeed: 12 },
					{ aSeed: 13, bSeed: 4 },
					{ aSeed: 3, bSeed: 14 },
					{ aSeed: 11, bSeed: 6 },
					{ aSeed: 7, bSeed: 10 },
					{ aSeed: 15, bSeed: 2 },
				],
				[
					{ aFrom: 0, bFrom: 1 },
					{ aFrom: 2, bFrom: 3 },
					{ aFrom: 4, bFrom: 5 },
					{ aFrom: 6, bFrom: 7 },
				],
				[
					{ aFrom: 0, bFrom: 1 },
					{ aFrom: 2, bFrom: 3 },
				],
				[{ aFrom: 0, bFrom: 1 }],
			],
		},
		{
			size: 7,
			want: [
				[
					null,
					{ aSeed: 5, bSeed: 4 },
					{ aSeed: 3, bSeed: 6 },
					{ aSeed: 7, bSeed: 2 },
				],
				[
					{ aSeed: 1, bFrom: 1 },
					{ aFrom: 2, bFrom: 3 },
				],
				[{ aFrom: 0, bFrom: 1 }],
			],
		},
		{
			size: 5,
			want: [
				[null, { aSeed: 5, bSeed: 4 }, null, null],
				[
					{ aSeed: 1, bFrom: 1 },
					{ aSeed: 3, bSeed: 2 },
				],
				[{ aFrom: 0, bFrom: 1 }],
			],
		},
	];

	for (const { size, want } of cases) {
		test(`size=${size}`, () => {
			const got = draftPlayoffs(size);

			expect(got).toStrictEqual(want);
		});
	}
});
