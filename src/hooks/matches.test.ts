import { range } from "lodash-es";
import { expect, test } from "vitest";

import { getPoolStats, type PoolTeamStats } from "./matches";

// : Pool & { teams: PoolTeam[]; matches: PoolMatch[] }

const testCases = [
	// https://cbva.com/t/yn6DbvpC/pools/b
	{
		teams: range(5).map((teamId) => ({ teamId })),
		// 0: nick/frank
		// 1: pieter/chris
		// 2: justin/philip
		// 3: christian/brian
		// 4: edgar/nathaniel
		matches: [
			{
				teamAId: 0,
				teamBId: 1,
				winnerId: 0,
				sets: [
					{
						teamAScore: 21,
						teamBScore: 18,
						winnerId: 0,
					},
				],
			},
			{
				teamAId: 2,
				teamBId: 3,
				winnerId: 2,
				sets: [
					{
						teamAScore: 22,
						teamBScore: 20,
						winnerId: 2,
					},
				],
			},
			{
				teamAId: 4,
				teamBId: 1,
				winnerId: 1,
				sets: [
					{
						teamAScore: 19,
						teamBScore: 21,
						winnerId: 1,
					},
				],
			},
			{
				teamAId: 0,
				teamBId: 2,
				winnerId: 2,
				sets: [
					{
						teamAScore: 19,
						teamBScore: 21,
						winnerId: 2,
					},
				],
			},
			{
				teamAId: 3,
				teamBId: 4,
				winnerId: 3,
				sets: [
					{
						teamAScore: 21,
						teamBScore: 16,
						winnerId: 3,
					},
				],
			},
			{
				teamAId: 1,
				teamBId: 2,
				winnerId: 2,
				sets: [
					{
						teamAScore: 15,
						teamBScore: 21,
						winnerId: 2,
					},
				],
			},
			{
				teamAId: 0,
				teamBId: 4,
				winnerId: 0,
				sets: [
					{
						teamAScore: 21,
						teamBScore: 16,
						winnerId: 0,
					},
				],
			},
			{
				teamAId: 3,
				teamBId: 1,
				winnerId: 1,
				sets: [
					{
						teamAScore: 19,
						teamBScore: 21,
						winnerId: 1,
					},
				],
			},
			{
				teamAId: 2,
				teamBId: 4,
				winnerId: 4,
				sets: [
					{
						teamAScore: 14,
						teamBScore: 21,
						winnerId: 4,
					},
				],
			},
			{
				teamAId: 0,
				teamBId: 3,
				winnerId: 3,
				sets: [
					{
						teamAScore: 17,
						teamBScore: 21,
						winnerId: 3,
					},
				],
			},
		],
		want: {
			// 0: nick/frank
			0: {
				rank: 3,
				wins: new Set([1, 4]),
				losses: new Set([2, 3]),
				headToHead: 1,
				tiePointDiff: -1,
				tieHeadToHead: 1,
				totalPointDiff: 2,
			},
			// 1: pieter/chris
			1: {
				rank: 4,
				wins: new Set([4, 3]),
				losses: new Set([0, 2]),
				headToHead: 1,
				tiePointDiff: -1,
				tieHeadToHead: 0,
				totalPointDiff: -5,
			},
			// 2: justin/philip
			2: {
				rank: 1,
				wins: new Set([3, 1, 0]),
				losses: new Set([4]),
				headToHead: 0,
				tiePointDiff: 0,
				tieHeadToHead: 0,
				totalPointDiff: 3,
			},
			// 3: christian/brian
			3: {
				rank: 2,
				wins: new Set([0, 4]),
				losses: new Set([1, 2]),
				headToHead: 1,
				tiePointDiff: 2,
				tieHeadToHead: 0,
				totalPointDiff: 5,
			},
			// 4: edgar/nathaniel
			4: {
				rank: 5,
				wins: new Set([2]),
				losses: new Set([0, 3, 1]),
				headToHead: 0,
				tiePointDiff: 0,
				tieHeadToHead: 0,
				totalPointDiff: -5,
			},
		} as { [key: number]: PoolTeamStats },
	},
	// TODO: implement two way tie test https://cbva.com/t/IfBQGlfT/pools/a
];

test("getPoolStats", () => {
	for (const { teams, matches, want } of testCases) {
		const got = getPoolStats({ teams, matches });

		for (const { teamId } of teams) {
			const gotStats = got[teamId];
			const wantStats = want[teamId];

			expect(gotStats).toStrictEqual(wantStats);
		}
	}
});
