import Uppy, { type Body, type Meta, type UppyFile } from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import Dashboard from "@uppy/react/dashboard";
import { useEffect, useState } from "react";

import "@uppy/react/css/style.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import Tus from "@uppy/tus";
import z from "zod";
import { requireAuthenticated } from "@/auth/shared";
import { internalServerError } from "@/lib/responses";
import { getSupabaseServerClient } from "@/supabase/server";

console.log(process.env.VITE_SUPABASE_ANON_KEY);
console.log(process.env.SUPABASE_ANON_KEY);

const getSignedUploadTokenFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(z.object({ filename: z.string() }))
	.handler(async ({ data: { filename } }) => {
		const supabase = getSupabaseServerClient();

		try {
			const { data, error } = await supabase.storage
				.from("uploads")
				.createSignedUploadUrl(filename);

			if (error) {
				throw internalServerError(error.message);
			}

			return { token: data.token };
		} catch (error) {
			throw internalServerError((error as Error).message);
		}
	});

export function Uploader() {
	const getSignedUploadToken = useServerFn(getSignedUploadTokenFn);

	console.log(process.env.VITE_SUPABASE_ANON_KEY);
	console.log(process.env.SUPABASE_ANON_KEY);

	const [uppy] = useState(() => {
		const uppyInstance = new Uppy({
			id: "file-uploader",
			restrictions: {
				maxNumberOfFiles: 1,
				allowedFileTypes: ["image/*"],
			},
			autoProceed: false,
		});

		uppyInstance.use(ImageEditor, {
			cropperOptions: {
				aspectRatio: undefined,
				viewMode: 1,
			},
			actions: {
				revert: true,
				rotate: true,
				granularRotate: true,
				flip: true,
				zoomIn: true,
				zoomOut: true,
				cropSquare: true,
				cropWidescreen: true,
				cropWidescreenVertical: true,
			},
		});

		// uppyInstance.use(XHRUpload, {
		// endpoint: "/api/files",
		// fieldName: "file",
		// });

		// supabase.co/storage/v1/upload/resumable
		//
		uppyInstance.use(Tus, {
			endpoint: `${process.env.SUPABASE_STORAGE_URL}/storage/v1/upload/resumable/sign`,
			headers: {
				apikey: process.env.SUPABASE_ANON_KEY,
			},
			uploadDataDuringCreation: true,
			chunkSize: 6 * 1024 * 1024,
			allowedMetaFields: [
				"bucketName",
				"objectName",
				"contentType",
				"cacheControl",
			],
			onError: (error) => {
				console.log("Failed because: " + error);
			},
		});

		return uppyInstance;
	});

	// Step 3: Handle event listeners
	useEffect(() => {
		const successHandler = (file, response) => {
			console.log("File uploaded successfully:", file.name);
			console.log("Server response:", response);
		};

		const errorHandler = (file, error) => {
			console.error("Error uploading file:", file.name);
			console.error("Error details:", error);
		};

		const completeHandler = (result) => {
			console.log("Upload complete! Files:", result.successful);
		};

		const fileAddedHandler = async <M extends Meta, B extends Body>(
			file: UppyFile<M, B>,
		) => {
			const supabaseMetadata = {
				bucketName: "venues",
				objectName: file.name,
				contentType: file.type,
			};

			file.meta = {
				...file.meta,
				...supabaseMetadata,
			};

			// Important - add signing token header
			const { token } = await getSignedUploadToken({
				data: { filename: file.name },
			});

			uppy.setFileState(file.id, {
				tus: {
					headers: {
						"x-signature": token,
					},
				},
			});
		};

		uppy.on("file-added", fileAddedHandler);

		// Add event listeners
		uppy.on("upload-success", successHandler);
		uppy.on("upload-error", errorHandler);
		uppy.on("complete", completeHandler);

		// Cleanup function to remove specific event listeners
		return () => {
			uppy.off("file-added", fileAddedHandler);
			uppy.off("upload-success", successHandler);
			uppy.off("upload-error", errorHandler);
			uppy.off("complete", completeHandler);
		};
	}, [uppy, getSignedUploadToken]);

	return (
		<Dashboard
			uppy={uppy}
			height={450}
			note="Accepted file types: jpg, png."
			proudlyDisplayPoweredByUppy={false}
			showLinkToFileUploadResult={false}
			showRemoveButtonAfterComplete={false}
		/>
	);
}
