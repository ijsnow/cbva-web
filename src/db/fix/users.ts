import "dotenv/config";

import { eq } from "drizzle-orm";
import { createClient } from "gel";
import { v4 as uuidv4 } from "uuid";
import { db } from "../connection";
import { playerProfiles, users } from "../schema";

async function main() {
	console.log("connecting to legacy db...", createClient);

	const legacy = createClient({
		instanceName: "legacy",
	});

	console.log("connected");

	const legacyUsers = await legacy.query<{
		id: string;
		phone: string;
		first_name: string;
		last_name: string;
		legal_name: string;
		created: string;
	}>(`
      select User {
        id,
        email,
        phone,
        legal_name,
        first_name,
        last_name,
        created
      }
        filter .email = ''
     `);

	let fixed = 0;
	let created = 0;

	await db.transaction(async (txn) => {
		for (const user of legacyUsers) {
			const existing = await txn._query.users.findFirst({
				where: (t, { eq }) => eq(t.phoneNumber, user.phone),
			});

			let userId: string | undefined = existing?.id;

			if (existing) {
				console.log("exists, not adding user", user.phone);
			} else {
				console.log("dne, adding user", user.phone);

				const [res] = await txn
					.insert(users)
					.values({
						id: user.id,
						email: `empty:${uuidv4()}`,
						role: "user",
						name: user.legal_name
							? user.legal_name
							: `${user.first_name} ${user.last_name}`,
						phoneNumber: user.phone ? user.phone : `empty:${uuidv4()}`,
						createdAt: new Date(user.created),
					})
					.returning({
						id: users.id,
					});

				userId = res.id;

				created += 1;
			}

			await txn
				.update(playerProfiles)
				.set({
					userId,
				})
				.where(eq(playerProfiles.externalRef, user.id));

			fixed += 1;
		}
	});

	console.log("fixed", fixed);
	console.log("created", created);
}

await main();

process.exit(0);
