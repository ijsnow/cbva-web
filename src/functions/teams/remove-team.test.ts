import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import {
	tournamentDivisions,
	tournamentDivisionTeams,
	poolMatches,
	poolTeams,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createTeams } from "@/tests/utils/users";
import { getQualifiedLevels } from "@/tests/utils/divisions";
import { removeTeam } from "./remove-team";

describe("removeTeam", () => {
	test("autopromotes waitlisted team when autopromoteWaitlist is enabled", async () => {
		// Create a tournament with one division
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 3,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Ensure autopromoteWaitlist is enabled (default is true)
		await db
			.update(tournamentDivisions)
			.set({
				capacity: 3,
				waitlistCapacity: 5,
				autopromoteWaitlist: true,
			})
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		// Add 2 waitlisted teams
		const levels = await getQualifiedLevels(db, "b");
		const waitlistedTeamIds = await createTeams(db, {
			count: 2,
			levels: levels.map(({ name }) => name),
			gender: "male",
		});

		const insertedWaitlistedTeams = await db
			.insert(tournamentDivisionTeams)
			.values(
				waitlistedTeamIds.map(({ id: teamId }, index) => ({
					tournamentDivisionId,
					teamId,
					status: "waitlisted" as const,
					order: 3 + index,
				})),
			)
			.returning({ id: tournamentDivisionTeams.id });

		// Get one of the confirmed teams to remove
		const confirmedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
		});

		expect(confirmedTeams).toHaveLength(3);

		// Clear seeds so autopromote can work (autopromote only works when teams aren't seeded yet)
		await db
			.update(tournamentDivisionTeams)
			.set({ seed: null })
			.where(eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisionId));

		// Verify initial state: 3 confirmed, 2 waitlisted
		const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(teamsBefore.filter((t) => t.status === "confirmed")).toHaveLength(3);
		expect(teamsBefore.filter((t) => t.status === "waitlisted")).toHaveLength(
			2,
		);

		// Remove a confirmed team
		await removeTeam({
			data: {
				id: confirmedTeams[0].id,
				late: false,
			},
		});

		// Verify that the team was withdrawn
		const removedTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, confirmedTeams[0].id),
		});

		expect(removedTeam?.status).toBe("withdraw");

		// Verify that the first waitlisted team was auto-promoted
		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(teamsAfter.filter((t) => t.status === "confirmed")).toHaveLength(3);
		expect(teamsAfter.filter((t) => t.status === "waitlisted")).toHaveLength(1);
		expect(teamsAfter.filter((t) => t.status === "withdraw")).toHaveLength(1);

		// Verify the first waitlisted team was promoted
		const promotedTeam = teamsAfter.find(
			(t) => t.id === insertedWaitlistedTeams[0].id,
		);
		expect(promotedTeam?.status).toBe("confirmed");

		// Verify the second waitlisted team is still waitlisted
		const stillWaitlisted = teamsAfter.find(
			(t) => t.id === insertedWaitlistedTeams[1].id,
		);
		expect(stillWaitlisted?.status).toBe("waitlisted");
	});

	test("does not autopromote when autopromoteWaitlist is disabled", async () => {
		// Create a tournament with one division
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 3,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Disable autopromoteWaitlist
		await db
			.update(tournamentDivisions)
			.set({
				capacity: 3,
				waitlistCapacity: 5,
				autopromoteWaitlist: false,
			})
			.where(eq(tournamentDivisions.id, tournamentDivisionId));

		// Add a waitlisted team
		const levels = await getQualifiedLevels(db, "b");
		const waitlistedTeamIds = await createTeams(db, {
			count: 1,
			levels: levels.map(({ name }) => name),
			gender: "male",
		});

		const [insertedWaitlistedTeam] = await db
			.insert(tournamentDivisionTeams)
			.values([
				{
					tournamentDivisionId,
					teamId: waitlistedTeamIds[0].id,
					status: "waitlisted" as const,
					order: 3,
				},
			])
			.returning({ id: tournamentDivisionTeams.id });

		// Get one of the confirmed teams to remove
		const confirmedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
		});

		expect(confirmedTeams).toHaveLength(3);

		// Remove a confirmed team
		await removeTeam({
			data: {
				id: confirmedTeams[0].id,
				late: false,
			},
		});

		// Verify that the team was withdrawn
		const removedTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, confirmedTeams[0].id),
		});

		expect(removedTeam?.status).toBe("withdraw");

		// Verify that the waitlisted team was NOT auto-promoted
		const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(teamsAfter.filter((t) => t.status === "confirmed")).toHaveLength(2);
		expect(teamsAfter.filter((t) => t.status === "waitlisted")).toHaveLength(1);
		expect(teamsAfter.filter((t) => t.status === "withdraw")).toHaveLength(1);

		// Verify the waitlisted team is still waitlisted
		const stillWaitlisted = teamsAfter.find(
			(t) => t.id === insertedWaitlistedTeam.id,
		);
		expect(stillWaitlisted?.status).toBe("waitlisted");
	});

	test("sets late-withdraw status when late flag is true", async () => {
		// Create a tournament with one division
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 3,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get one of the confirmed teams to remove
		const confirmedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
		});

		expect(confirmedTeams).toHaveLength(3);

		// Remove a confirmed team with late flag
		await removeTeam({
			data: {
				id: confirmedTeams[0].id,
				late: true,
			},
		});

		// Verify that the team has late-withdraw status
		const removedTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, confirmedTeams[0].id),
		});

		expect(removedTeam?.status).toBe("late-withdraw");
	});

	test("replaces team manually and updates pool matches", async () => {
		// Create a tournament with pools and pool matches
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 4,
					pools: 1,
				},
			],
			poolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Add a waitlisted team that will be used as replacement
		const levels = await getQualifiedLevels(db, "b");
		const replacementTeamIds = await createTeams(db, {
			count: 1,
			levels: levels.map(({ name }) => name),
			gender: "male",
		});

		const [insertedReplacementTeam] = await db
			.insert(tournamentDivisionTeams)
			.values([
				{
					tournamentDivisionId,
					teamId: replacementTeamIds[0].id,
					status: "waitlisted" as const,
					order: 4,
				},
			])
			.returning({ id: tournamentDivisionTeams.id });

		// Get one of the confirmed teams to remove
		const confirmedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq, and }) =>
				and(
					eq(t.tournamentDivisionId, tournamentDivisionId),
					eq(t.status, "confirmed"),
				),
		});

		expect(confirmedTeams).toHaveLength(4);

		const teamToRemove = confirmedTeams[0];

		// Get pool matches where this team participates
		const matchesBeforeAsTeamA = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamAId, teamToRemove.id),
		});

		const matchesBeforeAsTeamB = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamBId, teamToRemove.id),
		});

		const totalMatchesBefore =
			matchesBeforeAsTeamA.length + matchesBeforeAsTeamB.length;

		expect(totalMatchesBefore).toBeGreaterThan(0);

		// Remove the team with a replacement
		await removeTeam({
			data: {
				id: teamToRemove.id,
				late: false,
				replacementTeamId: insertedReplacementTeam.id,
			},
		});

		// Verify that the team was withdrawn
		const removedTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, teamToRemove.id),
		});

		expect(removedTeam?.status).toBe("withdraw");

		// Verify that the replacement team took over the seed
		const replacementTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, insertedReplacementTeam.id),
		});

		expect(replacementTeam?.seed).toBe(teamToRemove.seed);

		// Verify that all pool matches were updated to use the replacement team
		const matchesAfterAsTeamA = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamAId, insertedReplacementTeam.id),
		});

		const matchesAfterAsTeamB = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamBId, insertedReplacementTeam.id),
		});

		const totalMatchesAfter =
			matchesAfterAsTeamA.length + matchesAfterAsTeamB.length;

		expect(totalMatchesAfter).toBe(totalMatchesBefore);

		// Verify that the poolTeam was updated to reference the replacement team
		const poolTeamBefore = await db.query.poolTeams.findFirst({
			where: (t, { eq }) => eq(t.teamId, teamToRemove.id),
		});

		expect(poolTeamBefore).toBeUndefined();

		const poolTeamAfter = await db.query.poolTeams.findFirst({
			where: (t, { eq }) => eq(t.teamId, insertedReplacementTeam.id),
		});

		expect(poolTeamAfter).toBeDefined();
		expect(poolTeamAfter?.teamId).toBe(insertedReplacementTeam.id);

		// Verify that the original team is no longer in any pool matches
		const originalTeamMatchesAsTeamA = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamAId, teamToRemove.id),
		});

		const originalTeamMatchesAsTeamB = await db.query.poolMatches.findMany({
			where: (t, { eq }) => eq(t.teamBId, teamToRemove.id),
		});

		expect(originalTeamMatchesAsTeamA).toHaveLength(0);
		expect(originalTeamMatchesAsTeamB).toHaveLength(0);
	});
});
