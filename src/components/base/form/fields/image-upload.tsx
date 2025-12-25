import type { AnyFieldApi } from "@tanstack/react-form";
import { XIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { DropZone } from "@/components/base/upload-image/dropzone";
import { Button } from "../../button";
import { Label } from "../../field";
import { Modal, ModalHeading } from "../../modal";
import { Uploader, type UploaderProps } from "../../upload-image/uploader";

export type ImageUploadFieldProps = {
	className?: string;
	label?: ReactNode;
	isRequired?: boolean;
	field: AnyFieldApi;
} & Pick<UploaderProps, "bucket" | "prefix" | "circular">;

export function ImageUploadField({
	className,
	label,
	isRequired,
	field,
	bucket,
	prefix,
	circular,
}: ImageUploadFieldProps) {
	const [files, setFiles] = useState<File[] | undefined>(undefined);

	// TODO: make better

	const src = field.state.value;
	// 	? `${STORAGE_URL}/${bucket}/${field.state.value}`
	// 	: null;

	return (
		<div className={twMerge("flex flex-col gap-1", className)}>
			{label && <Label isRequired={isRequired}>{label}</Label>}

			{src ? (
				<div className="relative self-start">
					<div
						className={twMerge(
							"max-w-50 overflow-hidden border border-gray-300",
							circular && "rounded-full w-36 h-36",
						)}
					>
						<img
							src={src}
							alt="Cropped profile preview"
							className="w-full h-full object-cover"
						/>
					</div>

					<Button
						variant="icon"
						radius="full"
						className="absolute top-0 right-0"
						onPress={() => field.handleChange(null)}
					>
						<XIcon />
					</Button>
				</div>
			) : files ? (
				<Modal isOpen={true} onOpenChange={() => setFiles(undefined)}>
					<div className="p-3 flex flex-col space-y-8">
						<ModalHeading>Edit your profile photo</ModalHeading>

						<Uploader
							bucket={bucket}
							prefix={prefix}
							circular={circular}
							initialFiles={files}
							onUploadSuccess={(src) => {
								field.handleChange(src);
							}}
							onCancel={() => setFiles(undefined)}
							onCancelEdit={() => setFiles(undefined)}
						/>
					</div>
				</Modal>
			) : (
				<DropZone
					onDrop={(files) => {
						setFiles(files);
					}}
				/>
			)}
		</div>
	);
}
