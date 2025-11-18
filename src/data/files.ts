import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { createFileSchema, files, selectFileSchema } from "@/db/schema/files";

export const uploadFileServerFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			files: ["create"],
		}),
	])
	.inputValidator((data) => {
		if (!(data instanceof FormData)) {
			throw new Error("Expected FormData");
		}

		const formDataObj = Object.fromEntries(data.entries());

		return createFileSchema.parse(formDataObj);
	})
	.handler(async ({ data: { bytes } }) => {
		if (!bytes || !(bytes instanceof File)) {
			throw new Error("Missing or invalid image file");
		}

		const arrayBuffer = await bytes.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const [result] = await db
			.insert(files)
			.values({
				bytes: buffer,
			})
			.returning({ id: files.id });

		return {
			success: true,
			url: `/api/files?id=${result.id}`,
			message: "File uploaded successfully",
		};
	});

export const deleteFileServerFn = createServerFn({ method: "POST" })
	.inputValidator(selectFileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		await db.delete(files).where(eq(files.id, id));
	});
