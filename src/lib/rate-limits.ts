import { drizzle } from "drizzle-orm/node-postgres";
import { RateLimiterDrizzle } from "rate-limiter-flexible";
import { rateLimiterFlexibleSchema } from "@/db/schema";

const db = drizzle("postgres://root:secret@127.0.0.1:5432");

const rateLimiter = new RateLimiterDrizzle({
	storeClient: db,
	schema: rateLimiterFlexibleSchema,
	points: 3, // Number of points
	duration: 1, // Per second
});

export async function rateLimitMiddleware(key: string) {
	try {
		const rlRes = await rateLimiter.consume(userId, 1); // consume 1 point
		console.log(rlRes);
		// {
		//   remainingPoints: 2,
		//   msBeforeNext: 976,
		//   consumedPoints: 1,
		//   isFirstInDuration: true
		// }
	} catch (rejRes) {
		if (rejRes instanceof Error) {
			// Some error
			// It never happens if `insuranceLimiter` is configured
		} else {
			// If there is no error, rejRes promise is rejected with number of ms before next request allowed
			//
			// For example, in express.js you could set headers and send 429
			// const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
			// res.set('Retry-After', String(secs));
			// res.status(429).send('Too Many Requests');
		}

		throw rejRes;
	}
}

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	// console.log("hmmmmmm");

	const { impersonatedBy, ...viewer } = await getViewer();

	// console.log("uuuuuh", viewer);

	return await next({
		context: {
			viewer: !isEmpty(viewer)
				? {
						id: viewer.id,
						name: viewer.name,
						role: viewer.role,
						email: viewer.email,
						emailVerified: viewer.emailVerified,
						phoneNumber: viewer.phoneNumber,
						phoneNumberVerified: viewer.phoneNumberVerified,
					}
				: undefined,
			impersonatorId: impersonatedBy,
		},
	});
});
