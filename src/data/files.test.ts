import { describe, expect, test } from "vitest";

import { db } from "@/db/connection";
import { files } from "@/db/schema/files";
import { uploadFileServerFn } from "./files";

describe("Files Server Functions", () => {
	test("uploadFileServerFn", async () => {
		var blob = new Blob(["Test"], { type: "text/plain" });
		var file = new File([blob], "foo.txt", { type: "text/plain" });

		await uploadFileServerFn({ data: { bytes: file } });

		const dbResult = await db.select().from(files);

		expect(dbResult.length).toBe(1);
		expect(dbResult[0].bytes).toStrictEqual(Buffer.from("Test"));
	});
});
