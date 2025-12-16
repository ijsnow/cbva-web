import { useState } from "react";
import { Button } from "../base/button";
import { UploadImageModal, type UploadImageModalProps } from "./upload-image";

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`;

export type EditableImageProps = UploadImageModalProps & {
	source: string;
	alt?: string;
	className?: string;
	onSave: (source: string) => void;
	onDiscard: (originalSource: string) => void;
	editable: boolean;
};

export function EditableImage({
	source,
	alt,
	className,
	onSave,
	onDiscard,
	onUploadSuccess,
	editable,
	...uploaderProps
}: EditableImageProps) {
	const [originalSource, setOriginalSource] = useState<string>(source);
	const [updatedSource, setUpdatedSource] = useState<string | undefined>();

	const src = `${STORAGE_URL}/${uploaderProps.bucket}/${updatedSource ?? source}`;

	return (
		<>
			{alt && <img src={src} alt={alt} className={className} />}

			{editable &&
				(updatedSource ? (
					<div className="absolute top-3 right-3 flex flex-row space-x-2">
						<Button
							onPress={() => {
								onDiscard(originalSource);
								setUpdatedSource(undefined);

								// TODO: delete object in bucket
							}}
						>
							Discard
						</Button>
						<Button
							color="primary"
							onPress={() => {
								onSave(updatedSource);
								setOriginalSource(updatedSource);
								setUpdatedSource(undefined);
							}}
						>
							Save
						</Button>
					</div>
				) : (
					<UploadImageModal
						{...uploaderProps}
						onUploadSuccess={(source) => {
							onUploadSuccess(source);
							setUpdatedSource(source);
						}}
					/>
				))}
		</>
	);
}
