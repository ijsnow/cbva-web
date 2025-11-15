import { describe, expect, test } from "vitest";
import { snake, snake2, snakePlayoffs } from "./snake-draft";

describe("getSnakeDraft", () => {
	test("works for different pool sizes", () => {
		const cases = [
			{
				spots: 10,
				buckets: 2,
				want: [
					[1, 4, 5, 8, 9],
					[2, 3, 6, 7, 10],
				],
			},
			{
				spots: 15,
				buckets: 3,
				want: [
					[1, 6, 7, 12, 13],
					[2, 5, 8, 11, 14],
					[3, 4, 9, 10, 15],
				],
			},
			{
				spots: 20,
				buckets: 4,
				want: [
					[1, 8, 9, 16, 17],
					[2, 7, 10, 15, 18],
					[3, 6, 11, 14, 19],
					[4, 5, 12, 13, 20],
				],
			},
			{
				spots: 25,
				buckets: 5,
				want: [
					[1, 10, 11, 20, 21],
					[2, 9, 12, 19, 22],
					[3, 8, 13, 18, 23],
					[4, 7, 14, 17, 24],
					[5, 6, 15, 16, 25],
				],
			},
			{
				spots: 30,
				buckets: 6,
				want: [
					[1, 12, 13, 24, 25],
					[2, 11, 14, 23, 26],
					[3, 10, 15, 22, 27],
					[4, 9, 16, 21, 28],
					[5, 8, 17, 20, 29],
					[6, 7, 18, 19, 30],
				],
			},
			{
				spots: 35,
				buckets: 7,
				want: [
					[1, 14, 15, 28, 29],
					[2, 13, 16, 27, 30],
					[3, 12, 17, 26, 31],
					[4, 11, 18, 25, 32],
					[5, 10, 19, 24, 33],
					[6, 9, 20, 23, 34],
					[7, 8, 21, 22, 35],
				],
			},
			{
				spots: 40,
				buckets: 8,
				want: [
					[1, 16, 17, 32, 33],
					[2, 15, 18, 31, 34],
					[3, 14, 19, 30, 35],
					[4, 13, 20, 29, 36],
					[5, 12, 21, 28, 37],
					[6, 11, 22, 27, 38],
					[7, 10, 23, 26, 39],
					[8, 9, 24, 25, 40],
				],
			},
		];

		for (const { spots, buckets, want } of cases) {
			const got = snake(spots, buckets);

			expect(got).toStrictEqual(want);
		}
	});

	test("works for odd numbers", () => {
		const cases = [
			{
				spots: 9,
				buckets: 2,
				want: [
					[1, 4, 5, 8, 9],
					[2, 3, 6, 7],
				],
			},
			{
				spots: 13,
				buckets: 3,
				want: [
					[1, 6, 7, 12, 13],
					[2, 5, 8, 11],
					[3, 4, 9, 10],
				],
			},
			{
				spots: 17,
				buckets: 4,
				want: [
					[1, 8, 9, 16, 17],
					[2, 7, 10, 15],
					[3, 6, 11, 14],
					[4, 5, 12, 13],
				],
			},
			{
				spots: 23,
				buckets: 5,
				want: [
					[1, 10, 11, 20, 21],
					[2, 9, 12, 19, 22],
					[3, 8, 13, 18, 23],
					[4, 7, 14, 17],
					[5, 6, 15, 16],
				],
			},
			{
				spots: 19,
				buckets: 5,
				want: [
					[1, 10, 11],
					[2, 9, 12, 19],
					[3, 8, 13, 18],
					[4, 7, 14, 17],
					[5, 6, 15, 16],
				],
			},
			{
				spots: 27,
				buckets: 6,
				want: [
					[1, 12, 13, 24, 25],
					[2, 11, 14, 23, 26],
					[3, 10, 15, 22, 27],
					[4, 9, 16, 21],
					[5, 8, 17, 20],
					[6, 7, 18, 19],
				],
			},
			{
				spots: 31,
				buckets: 7,
				want: [
					[1, 14, 15, 28, 29],
					[2, 13, 16, 27, 30],
					[3, 12, 17, 26, 31],
					[4, 11, 18, 25],
					[5, 10, 19, 24],
					[6, 9, 20, 23],
					[7, 8, 21, 22],
				],
			},
			{
				spots: 35,
				buckets: 8,
				want: [
					[1, 16, 17, 32, 33],
					[2, 15, 18, 31, 34],
					[3, 14, 19, 30, 35],
					[4, 13, 20, 29],
					[5, 12, 21, 28],
					[6, 11, 22, 27],
					[7, 10, 23, 26],
					[8, 9, 24, 25],
				],
			},
		];

		for (const { spots, buckets, want } of cases) {
			const got = snake(spots, buckets);

			expect(got, `spots=${spots} buckets=${buckets}`).toStrictEqual(want);
		}
	});
});

describe("snake2", () => {
	test("works for different pool sizes", () => {
		const cases = [
			{
				spots: 10,
				buckets: 2,
				want: [
					{ id: 1, participants: [1, 4, 5, 8, 9].map((id) => ({ id })) },
					{ id: 2, participants: [2, 3, 6, 7, 10].map((id) => ({ id })) },
				],
			},
			{
				spots: 15,
				buckets: 3,
				want: [
					{ id: 1, participants: [1, 6, 7, 12, 13].map((id) => ({ id })) },
					{ id: 2, participants: [2, 5, 8, 11, 14].map((id) => ({ id })) },
					{ id: 3, participants: [3, 4, 9, 10, 15].map((id) => ({ id })) },
				],
			},
			{
				spots: 20,
				buckets: 4,
				want: [
					{ id: 1, participants: [1, 8, 9, 16, 17].map((id) => ({ id })) },
					{ id: 2, participants: [2, 7, 10, 15, 18].map((id) => ({ id })) },
					{ id: 3, participants: [3, 6, 11, 14, 19].map((id) => ({ id })) },
					{ id: 4, participants: [4, 5, 12, 13, 20].map((id) => ({ id })) },
				],
			},
		];

		for (const { spots, buckets, want } of cases) {
			const participants = Array.from({ length: spots }, (_, i) => ({
				id: i + 1,
			}));
			const bucketObjects = Array.from({ length: buckets }, (_, i) => ({
				id: i + 1,
			}));
			const got = snake2(participants, bucketObjects);

			expect(got).toStrictEqual(want);
		}
	});

	test("works for odd numbers", () => {
		const cases = [
			{
				spots: 9,
				buckets: 2,
				want: [
					{ id: 1, participants: [1, 4, 5, 8, 9].map((id) => ({ id })) },
					{ id: 2, participants: [2, 3, 6, 7].map((id) => ({ id })) },
				],
			},
			{
				spots: 13,
				buckets: 3,
				want: [
					{ id: 1, participants: [1, 6, 7, 12, 13].map((id) => ({ id })) },
					{ id: 2, participants: [2, 5, 8, 11].map((id) => ({ id })) },
					{ id: 3, participants: [3, 4, 9, 10].map((id) => ({ id })) },
				],
			},
			{
				spots: 17,
				buckets: 4,
				want: [
					{ id: 1, participants: [1, 8, 9, 16, 17].map((id) => ({ id })) },
					{ id: 2, participants: [2, 7, 10, 15].map((id) => ({ id })) },
					{ id: 3, participants: [3, 6, 11, 14].map((id) => ({ id })) },
					{ id: 4, participants: [4, 5, 12, 13].map((id) => ({ id })) },
				],
			},
		];

		for (const { spots, buckets, want } of cases) {
			const participants = Array.from({ length: spots }, (_, i) => ({
				id: i + 1,
			}));
			const bucketObjects = Array.from({ length: buckets }, (_, i) => ({
				id: i + 1,
			}));
			const got = snake2(participants, bucketObjects);

			expect(got, `spots=${spots} buckets=${buckets}`).toStrictEqual(want);
		}
	});

	test("snakePlayoffs", () => {
		const pools = "abcde";

		const cases = [
			{
				pools: Array.from({ length: 5 }).map((_, i) => ({
					id: i + 1,
					name: pools[i],
					teams: Array.from({ length: 4 }).map((_, j) => ({
						id: i * 4 + j + 1,
						finish: j + 1,
					})),
				})),
				count: 12,

				// - Pool 0 (a): IDs 1, 2, 3, 4
				// - Pool 1 (b): IDs 5, 6, 7, 8
				// - Pool 2 (c): IDs 9, 10, 11, 12
				// - Pool 3 (d): IDs 13, 14, 15, 16
				// - Pool 4 (e): IDs 17, 18, 19, 20

				want: [
					{
						id: 0,
						participants: [
							{
								id: 1,
								finish: 1,
								pool: "a",
								seed: 1,
							},
							{
								id: 13,
								finish: 1,
								pool: "d",
								seed: 4,
							},
							{
								id: 17,
								finish: 1,
								pool: "e",
								seed: 5,
							},
							{
								id: 10,
								finish: 2,
								pool: "c",
								seed: 8,
							},
							{
								id: 14,
								finish: 2,
								pool: "d",
								seed: 9,
							},
						],
					},
					{
						id: 1,
						participants: [
							{
								id: 5,
								finish: 1,
								pool: "b",
								seed: 2,
							},
							{
								id: 9,
								finish: 1,
								pool: "c",
								seed: 3,
							},
							{
								id: 2,
								finish: 2,
								pool: "a",
								seed: 6,
							},
							{
								id: 6,
								finish: 2,
								pool: "b",
								seed: 7,
							},
							{
								id: 18,
								finish: 2,
								pool: "e",
								seed: 10,
							},
						],
					},
				],
			},
		];

		for (const { pools, count, want } of cases) {
			expect(
				snakePlayoffs(pools, count),
				`pools.length=${pools.length}; count=${count} totalTeams=${pools.flatMap(({ teams }) => teams).length}`,
			).toStrictEqual(want);
		}
	});
});
