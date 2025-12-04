import { CalendarDate, parseDate, Time } from "@internationalized/date";
import z from "zod";

export const calendarDateSchema = () =>
	z.union([
		z.string().transform((input, ctx) => {
			try {
				return parseDate(input);
			} catch (_) {
				ctx.issues.push({
					code: "custom",
					message: "Invalid date string; expected YYYY-MM-DD",
					input,
				});

				return z.NEVER;
			}
		}),
		z.instanceof(CalendarDate).transform(({ year, month, day }, ctx) => {
			try {
				return parseDate(
					`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
				);
			} catch (_) {
				ctx.issues.push({
					code: "custom",
					message: "Invalid values for date",
					input: {
						year,
						month,
						day,
					},
				});

				return z.NEVER;
			}
		}),
		z
			.object({
				month: z.number().min(1).max(12),
				day: z.number().min(1).max(31),
				year: z.number(),
			})
			.transform(({ year, month, day }, ctx) => {
				try {
					return parseDate(
						`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
					);
				} catch (_) {
					ctx.issues.push({
						code: "custom",
						message: "Invalid values for date",
						input: {
							year,
							month,
							day,
						},
					});

					return z.NEVER;
				}
			}),
	]);

export const timeSchema = () => z.instanceof(Time);
