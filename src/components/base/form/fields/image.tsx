import type { AnyFieldApi } from "@tanstack/react-form";
import { ImageIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";
import {
	Button as AriaButton,
	DropZone,
	type FileDropItem,
	FileTrigger,
	Heading,
} from "react-aria-components";
import ReactCrop, {
	type Crop,
	centerCrop,
	makeAspectCrop,
	type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import clsx from "clsx";
import { Button } from "@/components/base/button";
import { Modal } from "@/components/base/modal";
import { subtitle } from "@/components/base/primitives";
import { useIsMounted } from "@/lib/dom";
import { Errors, Label } from "./shared";

const centerAspectCrop = (
	mediaWidth: number,
	mediaHeight: number,
	aspect: number,
) => {
	return centerCrop(
		makeAspectCrop(
			{
				unit: "%",
				width: 90,
			},
			aspect,
			mediaWidth,
			mediaHeight,
		),
		mediaWidth,
		mediaHeight,
	);
};

export type ImageFieldProps = {
	className?: string;
	label?: ReactNode;
	isRequired?: boolean;
	field: AnyFieldApi;
};

export function ImageField({
	className,
	label,
	field,
	isRequired,
}: ImageFieldProps) {
	const [src, setSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const isMounted = useIsMounted();

	const uploadFile = () => console.log("todo");
	const deleteFile = () => console.log("todo");

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;

		setImageFile(file);

		const reader = new FileReader();

		reader.addEventListener("load", () => {
			setSrc(reader.result as string);
			setIsModalOpen(true);
		});

		reader.readAsDataURL(file);
	}, []);

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const { width, height } = e.currentTarget;
		setCrop(centerAspectCrop(width, height, 1));
	};

	const getCroppedImage = useCallback(async (): Promise<File | null> => {
		if (!completedCrop || !imgRef.current || !src || !imageFile) {
			return null;
		}

		const image = imgRef.current;

		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;

		const canvas = document.createElement("canvas");

		canvas.width = completedCrop.width;
		canvas.height = completedCrop.height;

		const ctx = canvas.getContext("2d");

		if (!ctx) return null;

		ctx.drawImage(
			image,
			completedCrop.x * scaleX,
			completedCrop.y * scaleY,
			completedCrop.width * scaleX,
			completedCrop.height * scaleY,
			0,
			0,
			completedCrop.width,
			completedCrop.height,
		);

		return new Promise<File | null>((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						resolve(null);
						return;
					}

					const croppedFile = new File([blob], imageFile.name, {
						type: "image/jpeg",
						lastModified: Date.now(),
					});

					// Create URL for preview
					const url = URL.createObjectURL(blob);
					setCroppedImageUrl(url);

					resolve(croppedFile);
				},
				"image/jpeg",
				0.9,
			);
		});
	}, [completedCrop, src, imageFile]);

	const handleCropComplete = (crop: PixelCrop) => {
		setCompletedCrop(crop);
	};

	const handleCancel = () => {
		setSrc(null);
		setImageFile(null);
		setCompletedCrop(null);
		setIsModalOpen(false);

		field.handleBlur();
	};

	const handleRemove = () => {
		deleteFile({ data: { id: field.state.value } });

		setCroppedImageUrl(null);
	};

	const handleSave = async () => {
		const croppedFile = await getCroppedImage();

		if (!croppedFile) {
			return;
		}

		const data = new FormData();

		data.append("bytes", croppedFile);

		const result = await uploadFile({ data });

		field.handleChange(result.url);
		field.handleBlur();

		setIsModalOpen(false);
	};

	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			{label && <Label isRequired={isRequired}>{label}</Label>}

			{field.state.value ? (
				<div className="w-full flex flex-row gap-3">
					<div className="max-w-50 w-36 h-36 rounded-full overflow-hidden border border-gray-300">
						<img
							src={field.state.value}
							alt="Cropped profile preview"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="flex flex-col gap-2.5 justify-start items-stretch">
						<Button
							variant="filled"
							isDisabled={!isMounted}
							onClick={() => {
								handleRemove();
								field.handleChange(null);
							}}
						>
							<Trash2Icon size={18} />
						</Button>
					</div>
				</div>
			) : (
				<DropZone
					isDisabled={!isMounted}
					onDrop={async (e) => {
						const files = e.items.filter(
							(file): file is FileDropItem => file.kind === "file",
						);

						onDrop(await Promise.all(files.map((item) => item.getFile())));
					}}
				>
					{({ isDropTarget }) => (
						<FileTrigger
							acceptedFileTypes={["image/*"]}
							onSelect={(files) => {
								if (files) {
									onDrop(Array.from(files));
								}
							}}
						>
							<AriaButton
								className={clsx(
									"py-3 px-4 text-sm hover:bg-gray-100 rounded-lg border w-full text-center cursor-pointer flex flex-col items-center space-y-2",
									isDropTarget && "border-blue-600",
								)}
							>
								<ImageIcon size={32} />
								<p className="font-bold">
									Drag & drop a photo or{" "}
									<span className="underline">browse</span>
								</p>
								<p className="text-xs text-gray-400">
									Supported formats: jpg, png
								</p>
							</AriaButton>
						</FileTrigger>
					)}
				</DropZone>
			)}

			<Modal
				isOpen={Boolean(isModalOpen && src)}
				onOpenChange={(open) => {
					if (!open) {
						handleCancel();
					}
				}}
			>
				<div className="px-5 pt-8 pb-4 flex flex-col gap-3">
					<Heading className={subtitle()} slot="title">
						Crop your profile photo
					</Heading>

					<ReactCrop
						circularCrop
						crop={crop}
						onChange={(c) => setCrop(c)}
						onComplete={handleCropComplete}
						aspect={1}
						minWidth={100}
						minHeight={100}
					>
						<img
							ref={imgRef}
							src={src!}
							onLoad={onImageLoad}
							alt="Crop preview"
							style={{ maxWidth: "100%" }}
						/>
					</ReactCrop>

					<div className="pt-4 flex gap-2.5 justify-end">
						<Button onClick={handleCancel}>Cancel</Button>

						<Button
							onPress={handleSave}
							color="primary"
							isDisabled={!Boolean(completedCrop)}
						>
							Save
						</Button>
					</div>
				</div>
			</Modal>

			<Errors field={field} />
		</div>
	);
}
