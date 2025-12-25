import { ImageIcon } from "lucide-react";
import {
	Button as AriaButton,
	DropZone as AriaDropZone,
	type FileDropItem,
	FileTrigger,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { useIsMounted } from "@/lib/dom";

export type DropZoneProps = {
	className?: string;
	isRequired?: boolean;
	onDrop: (file: File[]) => void;
};

export function DropZone({ className, isRequired, onDrop }: DropZoneProps) {
	const isMounted = useIsMounted();

	return (
		<AriaDropZone
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
						className={twMerge(
							"py-3 px-4 text-sm hover:bg-gray-100 rounded-lg border w-full text-center cursor-pointer flex flex-col items-center space-y-2",
							isDropTarget && "border-blue-600",
						)}
					>
						<ImageIcon size={32} />
						<p className="font-bold">
							Drag & drop a photo or <span className="underline">browse</span>
						</p>
						<p className="text-xs text-gray-400">Supported formats: jpg, png</p>
					</AriaButton>
				</FileTrigger>
			)}
		</AriaDropZone>
	);
}
