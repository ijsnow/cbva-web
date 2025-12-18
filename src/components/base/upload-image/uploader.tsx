import Uppy, {
	type Body,
	type Meta,
	type UploadResult,
	type UppyFile,
} from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import Dashboard from "@uppy/react/dashboard";
import { useEffect, useState } from "react";

import "./uploader.css";

import "@uppy/react/css/style.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import { useServerFn } from "@tanstack/react-start";
import Tus from "@uppy/tus";
import { getSignedUploadTokenFn } from "@/data/storage";

export type UploaderProps = {
	bucket: string;
	prefix: string;
	onUploadSuccess: (source: string) => void;
	circular?: boolean;
};

export function Uploader({
	bucket,
	prefix,
	onUploadSuccess,
	circular,
}: UploaderProps) {
	const getSignedUploadToken = useServerFn(getSignedUploadTokenFn);

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
				aspectRatio: circular ? 1 : undefined,
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

		uppyInstance.use(Tus, {
			endpoint: `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/upload/resumable/sign`,
			headers: {
				apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
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

	const [storagePath, setStoragePath] = useState<string | undefined>();

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

		const completeHandler = <M extends Meta, B extends Body>(
			result: UploadResult<M, B>,
		) => {
			console.log("Upload complete! Files:", result.successful, result);

			if (result.successful?.length && storagePath) {
				onUploadSuccess(storagePath);
			}
		};

		const fileAddedHandler = async <M extends Meta, B extends Body>(
			file: UppyFile<M, B>,
		) => {
			const { token, storagePath: objectName } = await getSignedUploadToken({
				data: { bucket, prefix, filename: file.name },
			});

			setStoragePath(objectName);

			const supabaseMetadata = {
				bucketName: bucket,
				objectName,
				contentType: file.type,
			};

			file.meta = {
				...file.meta,
				...supabaseMetadata,
			};

			uppy.setFileState(file.id, {
				tus: {
					headers: {
						"x-signature": token,
					},
				},
				meta: file.meta,
			});
		};

		const startHandler = <M extends Meta, B extends Body>(
			files: UppyFile<M, B>[],
		) => {
			// console.log("Starting upload:", files);
		};

		// Add event listeners
		uppy.on("file-added", fileAddedHandler);
		uppy.on("upload-start", startHandler);
		uppy.on("upload-success", successHandler);
		uppy.on("upload-error", errorHandler);
		uppy.on("complete", completeHandler);

		// Cleanup function to remove specific event listeners
		return () => {
			uppy.off("file-added", fileAddedHandler);
			uppy.off("upload-start", startHandler);
			uppy.off("upload-success", successHandler);
			uppy.off("upload-error", errorHandler);
			uppy.off("complete", completeHandler);
		};
	}, [
		uppy,
		getSignedUploadToken,
		bucket,
		prefix,
		onUploadSuccess,
		storagePath,
	]);

	return (
		<Dashboard
			className={circular ? "circle" : undefined}
			uppy={uppy}
			autoOpen="imageEditor"
			height={450}
			note="Accepted file types: jpg, png."
			proudlyDisplayPoweredByUppy={false}
			showLinkToFileUploadResult={false}
			showRemoveButtonAfterComplete={false}
		/>
	);
}
