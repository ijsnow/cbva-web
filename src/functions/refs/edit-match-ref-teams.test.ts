import { describe, expect, test } from "vitest";
import { editMatchRefTeamSchema } from "./edit-match-ref-teams";

describe("editMatchRefTeamSchema", () => {
	describe("schema validation", () => {
		test("should fail when both poolMatchId and playoffMatchId are provided", () => {
			const input = {
				teamId: 1,
				poolMatchId: 1,
				playoffMatchId: 1,
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		test("should fail when neither poolMatchId nor playoffMatchId are provided", () => {
			const input = {
				teamId: 1,
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		test("should pass when only poolMatchId is provided", () => {
			const input = {
				teamId: 1,
				poolMatchId: 1,
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			console.log(result);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toMatchObject({
					teamId: 1,
					poolMatchId: 1,
				});
			}
		});

		test("should pass when only playoffMatchId is provided", () => {
			const input = {
				teamId: 1,
				playoffMatchId: 1,
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toMatchObject({
					teamId: 1,
					playoffMatchId: 1,
				});
			}
		});

		test("should fail when poolMatchId is not a number", () => {
			const input = {
				teamId: 1,
				poolMatchId: "not-a-number",
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		test("should fail when playoffMatchId is not a number", () => {
			const input = {
				teamId: 1,
				playoffMatchId: "not-a-number",
			};

			const result = editMatchRefTeamSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});
});
